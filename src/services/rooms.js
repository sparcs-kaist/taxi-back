const {
  roomModel,
  locationModel,
  userModel,
} = require("@/modules/stores/mongo");
const { emitChatEvent } = require("@/modules/socket");
const logger = require("@/modules/logger").default;
const {
  roomPopulateOption,
  formatSettlement,
  getIsOver,
} = require("@/modules/populates/rooms");
const {
  notifyRoomCreationAbuseToReportChannel,
} = require("@/modules/slackNotification");

// 이벤트 코드입니다.
const { eventConfig } = require("@/loadenv");
const eventPeriod = eventConfig && {
  startAt: new Date(eventConfig.period.startAt),
  endAt: new Date(eventConfig.period.endAt),
};
import { contracts } from "@/lottery";

const createHandler = async (req, res) => {
  const { name, from, to, time, maxPartLength } = req.body;

  try {
    if (from === to) {
      return res.status(400).json({
        error: "Rooms/create : locations are same",
      });
    }

    if (req.timestamp > Date.parse(req.body.time)) {
      return res.status(400).json({
        error: "Rooms/create : invalid timestamp",
      });
    }

    const createTime = new Date(time);
    createTime.setHours(0, 0, 0, 0);

    const maxTime = new Date();
    maxTime.setDate(maxTime.getDate() + 14);
    maxTime.setHours(0, 0, 0, 0);

    if (createTime.getTime() > maxTime.getTime()) {
      return res.status(400).json({
        error:
          "Rooms/create : cannot over 2 weeks on the basis of current Date",
      });
    }

    let fromLoc = await locationModel.findById(from);
    let toLoc = await locationModel.findById(to);
    if (!fromLoc || !toLoc) {
      return res.status(400).json({
        error: "Rooms/create : no corresponding locations",
      });
    }

    // 방 생성 요청을 한 사용자의 ObjectID를 room의 part 리스트에 추가
    const user = await userModel
      .findOne({ _id: req.userOid, withdraw: false })
      .populate("ongoingRoom");

    // 사용자의 참여중인 진행중인 방이 5개 이상이면 오류를 반환합니다.
    if (user.ongoingRoom.length >= 5) {
      return res.status(400).json({
        error: "Rooms/create : participating in too many rooms",
      });
    }

    // 사용자가 참여한 진행중인 방 중 송금을 아직 완료하지 않은 방이 있다면 오류를 반환합니다.
    const isSendRequired = checkIsSendRequired(user);
    if (isSendRequired) {
      return res.status(400).json({
        error: "Rooms/create : user has send-required rooms",
      });
    }

    const part = [{ user: user._id }]; // settlementStatus는 기본적으로 "not-departed"로 설정됨

    let room = new roomModel({
      name: name,
      from: fromLoc._id,
      to: toLoc._id,
      time: time,
      part: part,
      madeat: Date.now(),
      maxPartLength: maxPartLength,
      settlementTotal: 0,
    });
    await room.save();

    // 방의 ObjectID를 방 생성 요청을 한 사용자의 room 배열에 추가
    user.ongoingRoom.push(room._id);
    await user.save();

    // 입장 채팅을 보냅니다.
    await emitChatEvent(req.app.get("io"), {
      roomId: room._id,
      type: "in",
      content: user._id,
      authorId: user._id,
    });

    const roomObject = (await room.populate(roomPopulateOption)).toObject();
    const roomObjectFormated = formatSettlement(roomObject);

    // 이벤트 코드입니다.
    await contracts?.completeFirstRoomCreationQuest(req.userOid, req.timestamp);

    return res.send(roomObjectFormated);
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/create : internal server error",
    });
    return;
  }
};

const createTestHandler = async (req, res) => {
  // 이 Handler에서는 Parameter에 대해 추가적인 Validation을 하지 않습니다.
  const { time } = req.body;

  try {
    // 이벤트 코드입니다.
    if (
      !eventPeriod ||
      req.timestamp >= eventPeriod.endAt ||
      req.timestamp < eventPeriod.startAt
    )
      return res.json({ result: true });

    const countRecentlyMadeRooms = await roomModel.countDocuments({
      madeat: { $gte: new Date(req.timestamp - 86400000) }, // 밀리초 단위로 24시간을 나타냅니다.
      "part.0.user": req.userOid, // 방 최초 생성자를 저장하는 필드가 없으므로, 첫 번째 참여자를 생성자로 간주합니다.
    });
    if (!countRecentlyMadeRooms && countRecentlyMadeRooms !== 0)
      return res
        .status(500)
        .json({ error: "Rooms/create/test : internal server error" });

    const dateTime = new Date(time);
    const candidateRooms = await roomModel
      .find(
        {
          time: {
            $gte: new Date(dateTime.getTime() - 43200000),
            $lte: new Date(dateTime.getTime() + 43200000),
          },
          part: { $elemMatch: { user: req.userOid } },
        },
        "from to time maxPartLength"
      )
      .limit(2)
      .lean();
    if (!candidateRooms)
      return res
        .status(500)
        .json({ error: "Rooms/create/test : internal server error" });

    const isAbusing = checkIsAbusing(
      req.body,
      countRecentlyMadeRooms,
      candidateRooms
    );
    if (isAbusing) {
      const user = await userModel
        .findOne({ _id: req.userOid, withdraw: false })
        .lean();
      notifyRoomCreationAbuseToReportChannel(
        req.userOid,
        user?.nickname ?? req.userOid,
        req.body
      );
    }

    return res.json({ result: !isAbusing });
    return res.json({ result: true });
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/create/test : internal server error",
    });
  }
};

const publicInfoHandler = async (req, res) => {
  try {
    const roomObject = await roomModel
      .findOne({ _id: req.query.id })
      .lean()
      .populate(roomPopulateOption);
    if (roomObject) {
      // 방의 정산 정보는 개인정보로 방에 참여하기 전까지는 반환하지 않습니다.
      res.send(formatSettlement(roomObject, { includeSettlement: false }));
    } else {
      res.status(404).json({
        error: "Rooms/publicInfo : id does not exist",
      });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/publicInfo : internal server error",
    });
  }
};

const infoHandler = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.userOid, withdraw: false });
    const roomObject = await roomModel
      .findOne({ _id: req.query.id, "part.user": user._id })
      .lean()
      .populate(roomPopulateOption);
    if (roomObject) {
      const isOver = getIsOver(roomObject, user._id.toString());
      res.send(formatSettlement(roomObject, { isOver }));
    } else {
      res.status(404).json({
        error: "Rooms/info : id does not exist",
      });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/info : internal server error",
    });
  }
};

const joinHandler = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ _id: req.userOid, withdraw: false })
      .populate("ongoingRoom");

    // 사용자의 참여중인 진행중인 방이 5개 이상이면 오류를 반환합니다.
    if (user.ongoingRoom.length >= 5) {
      return res.status(400).json({
        error: "Rooms/join : participating in too many rooms",
      });
    }

    // 사용자가 참여한 진행중인 방 중 송금을 아직 완료하지 않은 방이 있다면 오류를 반환합니다.
    const isSendRequired = checkIsSendRequired(user);
    if (isSendRequired) {
      return res.status(400).json({
        error: "Rooms/join : user has send-required rooms",
      });
    }

    const room = await roomModel.findById(req.body.roomId);
    if (!room) {
      res.status(404).json({
        error: "Rooms/join : no corresponding room",
      });
      return;
    }

    // 사용자가 이미 참여중인 방인 경우, 409 Conflict 오류를 반환합니다.
    if (
      room.part
        .map((part) => part.user.toString())
        .includes(user._id.toString())
    ) {
      return res.status(409).json({
        error: "Rooms/join : " + user.id + " Already in room",
      });
    }

    // 방이 이미 출발한 경우, 400 오류를 반환합니다.
    if (req.timestamp >= room.time) {
      res.status(400).json({
        error: "Rooms/join : The room has already departed",
      });
      return;
    }

    // 방의 인원이 모두 찬 경우, 400 오류를 반환합니다.
    if (room.part.length + 1 > room.maxPartLength) {
      res.status(400).json({
        error: "Rooms/join : The room is already full",
      });
      return;
    }

    room.part.push({ user: user._id });
    user.ongoingRoom.push(room._id);
    await user.save();
    await room.save();

    // 입장 채팅을 보냅니다.
    await emitChatEvent(req.app.get("io"), {
      roomId: room._id,
      type: "in",
      content: user._id,
      authorId: user._id,
    });

    const roomObject = (await room.populate(roomPopulateOption)).toObject();
    res.send(formatSettlement(roomObject));
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/join : internal server error",
    });
  }
};

const abortHandler = async (req, res) => {
  const isOvertime = (room, time) => {
    if (new Date(room.time) <= time) return true;
    else return false;
  };

  try {
    const user = await userModel.findOne({ _id: req.userOid, withdraw: false });
    const room = await roomModel.findById(req.body.roomId);
    if (!user) {
      res.status(400).json({
        error: "Rooms/abort : Bad request",
      });
      return;
    }
    if (!room) {
      res.status(404).json({
        error: "Rooms/abort : no corresponding room",
      });
      return;
    }

    // 해당 방의 참여자 목록에서 사용자를 제거합니다.
    // 사용자가 해당 룸의 구성원이 아닌 경우, 403 오류를 반환합니다.
    const roomPartIndex = room.part
      .map((part) => part.user.toString())
      .indexOf(user._id.toString());
    if (roomPartIndex === -1) {
      return res.status(403).json({
        error: "Rooms/abort : did not joined the room",
      });
    }

    const userOngoingRoomIndex = user.ongoingRoom.indexOf(room._id);
    const userDoneRoomIndex = user.doneRoom.indexOf(room._id);

    // 방의 출발시간이 지나고 정산이 되지 않으면 나갈 수 없음
    if (isOvertime(room, req.timestamp) && userOngoingRoomIndex !== -1) {
      return res.status(400).json({
        error: "Rooms/abort : cannot exit room. Settlement is not done",
      });
    }

    // 사용자가 참여중인 방 목록에서 방을 제거합니다.
    // 제거할 방이 없는 경우, 500 오류를 발생시킵니다.
    if (userOngoingRoomIndex !== -1) {
      user.ongoingRoom.splice(userOngoingRoomIndex, 1);
    } else if (userDoneRoomIndex !== -1) {
      user.doneRoom.splice(userDoneRoomIndex, 1);
    } else {
      // room.part에는 user가 있지만 user.ongoingRoom이나 user.doneRoom에는 room이 없는 상황.
      logger.error(
        `Rooms/abort: referential integrity error (user: ${user._id}, room: ${room._id})`
      );
      return res.status(500).json({
        error: "Rooms/abort : internal server error",
      });
    }
    await user.save();
    room.part.splice(roomPartIndex, 1);
    await room.save();

    // if (room.part.length <= 0) {
    // 남은 사용자가 없는 경우.
    // 채팅을 지워야 하고, 남은 뒷부분 코드 때문에 문제가 될 수 있을 것 같음
    // 따라서 모든 사용자가 나간 방을 지우지 않기로 결정함.
    // await room.remove();
    // }

    // 퇴장 채팅을 보냅니다.
    await emitChatEvent(req.app.get("io"), {
      roomId: room._id,
      type: "out",
      content: user._id,
      authorId: user._id,
    });

    const roomObject = (await room.populate(roomPopulateOption)).toObject();
    const isOver = getIsOver(roomObject, user._id.toString());

    res.send(formatSettlement(roomObject, { isOver }));
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/abort : internal server error",
    });
  }
};

const searchHandler = async (req, res) => {
  try {
    const { name, from, to, time, withTime, maxPartLength, isHome } = req.query;

    // 출발지와 도착지가 같은 경우
    if (from && to && from === to) {
      return res.status(400).json({
        error: "Rooms/search : Bad request",
      });
    }

    // 출발지나 도착지가 존재하지 않는 장소일 경우
    if (from) {
      const fromLocation = await locationModel.findById(from);
      if (!fromLocation || fromLocation?.isValid === false) {
        return res.status(400).json({
          error: "Rooms/search : no corresponding locations",
        });
      }
    }
    if (to) {
      const toLocation = await locationModel.findById(to);
      if (!toLocation || toLocation?.isValid === false) {
        return res.status(400).json({
          error: "Rooms/search : no corresponding locations",
        });
      }
    }

    const currentTime = new Date();
    currentTime.setSeconds(0);
    currentTime.setMilliseconds(0);

    const searchedTime = time ? new Date(time) : new Date(currentTime);
    if (!withTime) {
      searchedTime.setHours(0);
      searchedTime.setMinutes(0);
    }
    searchedTime.setSeconds(0);
    searchedTime.setMilliseconds(0);

    const minTime =
      searchedTime.getTime() >= currentTime.getTime()
        ? searchedTime // time이 현재 시간보다 미래인 경우
        : currentTime; // time이 현재 시간보다 과거인 경우

    // 검색 날짜 범위 : home -> 7, search -> 14
    const dateRange = isHome ? 7 : 14;

    // 검색 시간대는 해당 날짜의 자정으로 설정합니다.
    const maxTime = new Date(minTime);
    maxTime.setDate(minTime.getDate() + (time ? 1 : dateRange));
    maxTime.setHours(0);
    maxTime.setMinutes(0);
    maxTime.setSeconds(0);
    maxTime.setMilliseconds(0);

    // 검색 쿼리를 설정합니다.
    const query = {};
    if (name) query.name = { $regex: new RegExp(name, "i") }; // 'i': 대소문자 무시
    if (maxPartLength) query.maxPartLength = { $eq: maxPartLength };
    if (from) query.from = from;
    if (to) query.to = to;

    query.time = { $gte: minTime, $lt: maxTime };
    query["part.0"] = { $exists: true }; // 참여자가 1명 이상인 방만 반환

    const rooms = await roomModel
      .find(query)
      .sort({ time: 1 })
      .limit(1000)
      .populate(roomPopulateOption)
      .lean();
    res.json(
      rooms.map((room) => formatSettlement(room, { includeSettlement: false }))
    );
  } catch (err) {
    res.status(500).json({
      error: "Rooms/search : Internal server error",
    });
  }
};

const searchByUserHandler = async (req, res) => {
  try {
    // lean()이 적용된 user를 response에 반환해줘야 하기 때문에 user를 한 번 더 지정한다.
    const user = await userModel
      .findOne({ _id: req.userOid, withdraw: false })
      .populate({
        path: "ongoingRoom",
        options: {
          limit: 1000,
          // ongoingRoom 은 시간 오름차순 정렬
          sort: { time: 1 },
        },
        populate: roomPopulateOption,
      })
      .populate({
        path: "doneRoom",
        options: {
          limit: 1000,
          // doneRoom 은 시간 내림차순 정렬
          sort: { time: -1 },
        },
        populate: roomPopulateOption,
      })
      .lean();

    // 정산완료여부 기준으로 진행중인 방과 완료된 방을 분리해서 응답을 전송합니다.
    const response = {};
    response.ongoing = user.ongoingRoom.map((room) =>
      formatSettlement(room, { isOver: false })
    );
    response.done = user.doneRoom.map((room) =>
      formatSettlement(room, { isOver: true })
    );
    res.json(response);
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/searchByUser : internal server error",
    });
  }
};

const commitSettlementHandler = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.userOid, withdraw: false });
    const { roomId } = req.body;
    const roomObject = await roomModel
      .findOneAndUpdate(
        {
          _id: roomId,
          part: {
            $elemMatch: {
              user: user._id,
              settlementStatus: "not-departed",
            },
          },
          time: { $lte: req.timestamp },
        },
        {
          "part.$[payer].settlementStatus": "paid",
          "part.$[rests].settlementStatus": "send-required",
          settlementTotal: 1,
        },
        {
          new: true,
          arrayFilters: [
            { "payer.user": { $eq: user._id } },
            { "rests.user": { $ne: user._id } },
          ],
        }
      )
      .lean()
      .populate(roomPopulateOption);

    if (!roomObject) {
      return res.status(404).json({
        error: "Rooms/:id/commitSettlement : cannot find settlement info",
      });
    }

    // 해당 방의 ObjectId를 user.ongoingRoom에서 user.doneRoom으로 이동시킵니다.
    // user.ongoingRoom에 해당 방의 ObjectId가 존재하지 않는 경우, 500 오류를 반환합니다.
    // 위와 같은 경우에도 해당 방을 user.doneRoom에 추가하는 데 문제가 없어야 합니다.
    user.doneRoom.push(roomId);

    const userOngoingRoomIndex = user.ongoingRoom.indexOf(roomId);
    if (userOngoingRoomIndex === -1) {
      await user.save();
      return res.status(500).json({
        error: "Rooms/:id/commitSettlement : internal server error",
      });
    }
    user.ongoingRoom.splice(userOngoingRoomIndex, 1);

    await user.save();

    // 정산 채팅을 보냅니다.
    await emitChatEvent(req.app.get("io"), {
      roomId,
      type: "settlement",
      content: user._id,
      authorId: user._id,
    });

    // 이벤트 코드입니다.
    await contracts?.completeFareSettlementQuest(
      req.userOid,
      req.timestamp,
      roomObject
    );

    // 수정한 방 정보를 반환합니다.
    res.send(formatSettlement(roomObject, { isOver: true }));
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/:id/commitSettlement : internal server error",
    });
  }
};

const commitPaymentHandler = async (req, res) => {
  try {
    const { roomId } = req.body;
    const user = await userModel.findOne({ _id: req.userOid, withdraw: false });
    let roomObject = await roomModel
      .findOneAndUpdate(
        {
          _id: roomId,
          part: {
            $elemMatch: {
              user: user._id,
              settlementStatus: "send-required",
            },
          },
        },
        {
          $set: { "part.$.settlementStatus": "sent" },
          $inc: { settlementTotal: 1 },
        },
        {
          new: true,
        }
      )
      .lean()
      .populate(roomPopulateOption);

    if (!roomObject) {
      return res.status(404).json({
        error: "Rooms/:id/commitPayment : cannot find settlement info",
      });
    }

    // 해당 방의 ObjectId를 user.ongoingRoom에서 user.doneRoom으로 이동시킵니다.
    // user.ongoingRoom에 해당 방의 ObjectId가 존재하지 않는 경우, 500 오류를 반환합니다.
    // 위와 같은 경우에도 해당 방을 user.doneRoom에 추가하는 데 문제가 없어야 합니다.
    user.doneRoom.push(roomId);

    const userOngoingRoomIndex = user.ongoingRoom.indexOf(roomId);
    if (userOngoingRoomIndex === -1) {
      await user.save();
      return res.status(500).json({
        error: "Rooms/:id/commitPayment : internal server error",
      });
    }
    user.ongoingRoom.splice(userOngoingRoomIndex, 1);

    await user.save();

    // 송금 채팅을 보냅니다.
    await emitChatEvent(req.app.get("io"), {
      roomId,
      type: "payment",
      content: user._id,
      authorId: user._id,
    });

    // 이벤트 코드입니다.
    await contracts?.completeFarePaymentQuest(
      req.userOid,
      req.timestamp,
      roomObject
    );

    // 수정한 방 정보를 반환합니다.
    res.send(formatSettlement(roomObject, { isOver: true }));
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/:id/commitPayment : internal server error",
    });
  }
};

const checkIsAbusing = (
  { from, to, time, maxPartLength },
  countRecentlyMadeRooms,
  candidateRooms
) => {
  /**
   * 방을 생성하였을 때, 다음 조건 중 하나라도 만족하게 되면 어뷰징 가능성이 있다고 판단합니다.
   * 1. 참여한 방 중, 생성하려는 방의 출발 시간 앞 뒤 12시간 내에 출발하는 방이 3개 이상인 경우
   * 2. 참여한 방 중, 생성하려는 방의 출발 시간 앞 뒤 12시간 내에 출발하는 방이 2개이고, 다음 조건 중 하나 이상을 만족하는 경우
   *    a. 두 방의 출발 시간 간격이 1시간 이하인 경우
   *    b. 두 방의 출발 시간 간격이 1시간 초과이고, 다음 조건 중 하나 이상을 만족하는 경우
   *       i. 두 방의 출발지가 같은 경우
   *       ii. 두 방의 목적지가 같은 경우
   *       iii. 먼저 출발하는 방의 목적지와 나중에 출발하는 방의 출발지가 다른 경우
   *       iv. 두 방의 최대 탑승 가능 인원이 모두 2명인 경우
   * 3. 최근 24시간 내에 생성한 방이 4개 이상인 경우
   */

  if (countRecentlyMadeRooms + 1 >= 4) return true; // 조건 3

  if (candidateRooms.length + 1 >= 3) return true; // 조건 1
  if (candidateRooms.length + 1 < 2) return false; // 조건 2의 여집합

  let firstRoom = {
    from: candidateRooms[0].from.toString(),
    to: candidateRooms[0].to.toString(),
    time: candidateRooms[0].time,
    maxPartLength: candidateRooms[0].maxPartLength,
  };
  let secondRoom = {
    from,
    to,
    time: new Date(time),
    maxPartLength,
  };
  if (secondRoom.time < firstRoom.time) {
    [firstRoom, secondRoom] = [secondRoom, firstRoom];
  }

  if (secondRoom.time - firstRoom.time <= 3600000) return true; // 조건 2-a
  if (
    firstRoom.from === secondRoom.from ||
    firstRoom.to === secondRoom.to ||
    firstRoom.to !== secondRoom.from
  )
    return true; // 조건 2-b-i, 2-b-ii, 2-b-iii
  if (firstRoom.maxPartLength === 2 && secondRoom.maxPartLength === 2)
    return true; // 조건 2-b-iv

  return false;
};

/**
 * User Object가 주어졌을 때, 해당 유저가 참여한 방 중 아직 유저가 송금하지 않은 방이 있는지 확인합니다.
 * @param {Object} userObject - userObject입니다. ongoingRoom 정보를 포함한 형태의 object여야 합니다.
 * @return {Boolean} 송금해야 하는 방이 있는지 여부를 반환합니다.
 */
const checkIsSendRequired = (userObject) => {
  // user의 참여중인 방의 part 정보만 가져오기
  const ongoingRoomParts = userObject.ongoingRoom.map((room) => room.part);
  // part에서 자신의 id에 해당하는 part만 가져오기
  const userParts = ongoingRoomParts
    .map((partList) =>
      partList.filter((part) => part.user.equals(userObject._id))
    )
    .filter((partList) => partList.length > 0);
  // 해당 part object들 중 settlementStatus가 "send-required"인 part 찾기
  const sendRequired = userParts
    .map((partList) => partList[0].settlementStatus)
    .filter((status) => status === "send-required");

  return sendRequired.length > 0;
};

/**
 * @todo Unused -> Maybe used in the future?
 */
// const editHandler = async (req, res) => {
//   const { roomId, name, from, to, time, maxPartLength } = req.body;
//   // 수정할 값이 주어지지 않은 경우
//   if (!name && !from && !to && !time && !maxPartLength) {
//     res.status(400).json({
//       error: "Rooms/edit : Bad request",
//     });
//     return;
//   }

//   // 출발지와 도착지가 같은 경우
//   if (from && to && from === to) {
//     return res.status(400).json({
//       error: "Rooms/edit : Bad request",
//     });
//   }

//   // Room update query에 사용할 filter입니다.
//   // 방에 참여중인 인원만 방 정보를 수정할 수 있습니다.
//   const user = await userModel.findOne({ _id: req.userOid, withdraw: false }, "_id");
//   const roomFilter = {
//     _id: roomId,
//     part: {
//       $elemMatch: {
//         user: user._id,
//       },
//     },
//   };

//   const changeJSON = {};
//   if (name) changeJSON.name = name;
//   if (from) {
//     const fromLoc = await locationModel.findById(from);
//     if (!fromLoc)
//       return res.status(400).json({
//         error: "Rooms/edit : Bad request",
//       });
//     changeJSON.from = from;
//   }
//   if (to) {
//     const toLoc = await locationModel.findById(to);
//     if (!toLoc)
//       return res.status(400).json({
//         error: "Rooms/edit : Bad request",
//       });
//     changeJSON.to = to;
//   }
//   if (time) changeJSON.time = time;
//   if (maxPartLength) {
//     changeJSON.maxPartLength = maxPartLength;

//     // 현재 참여 인원보다 최대 인원 수를 작게 설정할 수 없습니다.
//     roomFilter[`part.${maxPartLength}`] = { $exists: false };
//   }

//   try {
//     // 방 정보를 요청받은 것과 같이 수정합니다.
//     let result = await roomModel.findOneAndUpdate(roomFilter, changeJSON, {
//       new: true,
//     });
//     if (result) {
//       const roomObject = (await result.populate(roomPopulateOption)).toObject();
//       const isOver = getIsOver(room, user._id);
//       res.send(formatSettlement(roomObject, { isOver }));
//     } else {
//       res.status(404).json({
//         error: "Rooms/edit : such room not exist",
//       });
//     }
//   } catch (err) {
//     logger.error(err);
//     res.status(500).json({
//       error: "Rooms/edit : internal server error",
//     });
//   }
// };

module.exports = {
  publicInfoHandler,
  infoHandler,
  createHandler,
  createTestHandler,
  joinHandler,
  abortHandler,
  searchHandler,
  searchByUserHandler,
  commitPaymentHandler,
  commitSettlementHandler,
  // editHandler,
};
