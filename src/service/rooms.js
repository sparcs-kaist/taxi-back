const { roomModel, locationModel, userModel } = require("../db/mongo");
const { emitChatEvent } = require("../route/chats.socket");
const { leaveChatRoom } = require("../auth/login");
const logger = require("../modules/logger");
//const taxiResponse = require('../taxiResponse')

// 장소, 참가자 목록의 ObjectID 제거하기
const extractLocationName = (location) => location.name;
const roomPopulateQuery = [
  { path: "part", select: "id name nickname -_id" },
  { path: "from", transform: extractLocationName },
  { path: "to", transform: extractLocationName },
];

const infoHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(403).json({
      error: "Rooms/info : not logged in",
    });
    return;
  }

  try {
    const user = await userModel.findOne({ id: userId });

    let room = await roomModel.findById(req.query.id);
    if (room) {
      // 사용자가 해당 룸의 구성원이 아닌 경우, 403 오류를 반환한다.
      if (room.part.indexOf(user._id) === -1) {
        res.status(403).json({
          error: "Rooms/info : did not joined the room",
        });
        return;
      }
      //From mongoose v6, this needs to be changed to room.populate(roomPopulateQuery)
      await room.execPopulate(roomPopulateQuery);

      res.status(200).send(room);
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

const createHandler = async (req, res) => {
  const { name, from, to, time, maxPartLength } = req.body.data;

  try {
    let fromLoc = await locationModel.findOneAndUpdate(
      { name: from },
      {},
      { new: true, upsert: true }
    );
    let toLoc = await locationModel.findOneAndUpdate(
      { name: to },
      {},
      { new: true, upsert: true }
    );

    const user = await userModel.findOne({ id: req.userId });

    // 방 생성 요청을 한 사용자의 ObjectID를 room의 part 리스트에 추가
    const part = [user._id];

    let room = new roomModel({
      name: name,
      from: fromLoc._id,
      to: toLoc._id,
      time: time,
      part: part,
      madeat: Date.now(),
      maxPartLength: maxPartLength,
      settlement: { studentId: user._id, isSettlement: false },
      settlementTotal: 0,
      isOver: false,
    });
    await room.save();

    // 방의 ObjectID를 방 생성 요청을 한 사용자의 room 배열에 추가
    user.room.push(room._id);
    await user.save();

    await room.execPopulate(roomPopulateQuery);
    res.send(room);
    return;
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/create : internal server error",
    });
    return;
  }
};

const inviteHandler = async (req, res) => {
  try {
    let user = await userModel.findOne({ id: req.userId });
    let room = await roomModel.findById(req.body.roomId);
    if (!room) {
      res.status(404).json({
        error: "Rooms/invite : no corresponding room",
      });
      return;
    }

    let newUsers = [];

    // 사용자가 이미 참여중인 방인 경우, req.body.users의 사용자들을 방에 참여시킵니다.
    if (room.part.includes(user._id)) {
      for (const userID of req.body.users) {
        let newUser = await userModel.findOne({ id: userID });
        if (!newUser) {
          res.status(404).json({
            error: "Rooms/invite : no corresponding user",
          });
          return;
        }
        if (room.part.includes(newUser._id)) {
          res.status(409).json({
            error: "Rooms/invite : " + userID + " Already in room",
          });
          return;
        }
        // if ((room.part.length+req.body.users.length)>room.maxPartLength){ // 초대할 사람 수가 방의 남은 자리 수를 초과하면 초대가 불가능합니다.
        //   res.status(400).json({
        //     error: "Room/invite : There are too many people to invite to the room",
        //   });
        //   return;
        // }
        newUsers.push(newUser);
      }

      for (let newUser of newUsers) {
        room.part.push(newUser._id);
        newUser.room.push(room._id);
        room.settlement.push({ studentId: newUser._id, isSettlement: false });
        await newUser.save();
      }
    } else {
      // 사용자가 참여하지 않은 방의 경우, 사용자 자신만 참여하도록 요청했을 때에만 사용자를 방에 참여시킵니다.
      // 아닌 경우, 400 오류를 발생시킵니다.
      if (req.body.users.length != 1 || req.body.users[0] !== user.id) {
        res.status(400).json({
          error:
            "Rooms/invite : You cannot invite other user(s) when you are not joining the room",
        });
        return;
      }

      newUsers.push(user);
      room.part.push(user._id);
      user.room.push(room._id);
      room.settlement.push({ studentId: user._id, isSettlement: false });
      await user.save();
    }

    // "AAA님, BBB님" 처럼 사용자 목록을 텍스트로 가공합니다.
    const nicknames = newUsers.map((user) => user.nickname);
    const concatenatedNicknames = nicknames.join(" 님, ") + " 님";

    // 입장 채팅을 보냅니다.
    await emitChatEvent(req.app.get("io"), room._id, {
      text: `${concatenatedNicknames}이 입장했습니다`,
    });

    await room.save();
    await room.execPopulate(roomPopulateQuery);
    res.send(room);
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/invite : internal server error",
    });
  }
};

const abortHandler = async (req, res) => {
  const time = Date.now();
  const isOvertime = (room, time) => {
    if (new Date(room.time) <= time) return true;
    else return false;
  };

  try {
    let user = await userModel.findOne({ id: req.userId });
    if (!user) {
      res.status(400).json({
        error: "Rooms/abort : Bad request",
      });
      return;
    }

    let room = await roomModel.findById(req.body.roomId);
    if (!room) {
      res.status(404).json({
        error: "Rooms/abort : no corresponding room",
      });
      return;
    }

    // 사용자가 채팅방에 들어와있는 경우, 소켓 연결을 먼저 끊는다.
    if (req.session.socketId && req.session.chatRoomId) {
      req.app.get("io").in(req.session.socketId).disconnectSockets(true);
      leaveChatRoom({ session: req.session });
    }

    // 사용자가 참여중인 방 목록에서 해당 방을 제거하고, 해당 방의 참여자 목록에서 사용자를 제거한다.
    // 사용자가 해당 룸의 구성원이 아닌 경우, 403 오류를 반환한다.
    const roomPartIndex = room.part.indexOf(user._id);
    const userRoomIndex = user.room.indexOf(room._id);
    if (roomPartIndex === -1 || userRoomIndex === -1) {
      res.status(403).json({
        error: "Rooms/info : did not joined the room",
      });
      return;
    } else {
      // 방의 출발시간이 지나고 정산이 되지 않으면 나갈 수 없음
      if (isOvertime(room, time) && !room.isOver) {
        res.status(403).json({
          error: "Rooms/info : cannot exit room. Settlement is not done",
        });
        return;
      }
      room.part.splice(roomPartIndex, 1);
      room.settlement.splice(roomPartIndex, 1);
      user.room.splice(userRoomIndex, 1);
      await user.save();
      if (room.part.length !== 0) await room.save();
      else {
        //남은 사용자가 없는 경우.
        await room.remove();
      }
    }

    // 퇴장 채팅을 보냅니다.
    await emitChatEvent(req.app.get("io"), room._id, {
      text: `${user.nickname} 님이 퇴장했습니다.`,
    });
    await room.execPopulate(roomPopulateQuery);
    res.send(room);
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/abort : internal server error",
    });
  }
};

const searchHandler = async (req, res) => {
  const isRequestUnder1min = (date) => {
    const oneMinuteInMilliseconds = 60 * 1000;
    if (date.getTime() + oneMinuteInMilliseconds > Date.now()) return true;
    else return false;
  };

  const getTomorrow5am = (date) => {
    const tomorrowDate = new Date(date);
    // If the minTime is over 12 AM
    if (tomorrowDate.getUTCHours() >= 20) {
      tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
    }
    tomorrowDate.setUTCHours(20, 0, 0, 0);
    return tomorrowDate;
  };

  try {
    const { name, from, to, time } = req.query;
    let fromOid = null;
    let toOid = null;

    if (from && to && from === to) {
      res.status(400).json({
        error: "Room/search : Bad request",
      });
      return;
    }
    if (from) {
      const fromLocation = await locationModel.findOne({ name: from });
      fromOid = fromLocation._id;
    }

    if (to) {
      const toLocation = await locationModel.findOne({ name: to });
      toOid = toLocation._id;
    }

    // 검색 쿼리를 설정합니다.
    const query = {};
    if (name) query.name = { $regex: new RegExp(name, "i") }; // 'i': 대소문자 무시
    if (fromOid) query.from = fromOid;
    if (toOid) query.to = toOid;
    // 검색 시간대는 시작 시각으로부터 24시간으로 설정합니다.
    const minTime = time ? new Date(time) : new Date();

    if (!isRequestUnder1min(minTime)) {
      return res.status(400).json({
        error: "Room/search : Bad request",
      });
    }

    const maxTime = getTomorrow5am(minTime);
    query.time = { $gte: minTime, $lt: maxTime };

    const rooms = await roomModel
      .find(query)
      .sort({ time: 1 })
      .populate(roomPopulateQuery)
      .exec();

    res.json(rooms);
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/search : Internal server error",
    });
  }
};

const searchByUserHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(403).json({
      error: "Rooms/searchByUser : not logged in",
    });
  }

  try {
    const user = await userModel
      .findOne({ id: userId })
      .populate({
        path: "room",
        populate: roomPopulateQuery,
      })
      .lean()
      .exec();

    // 정산완료여부 기준으로 진행중인 방과 완료된 방을 분리해서 응답을 전송합니다.
    const response = {
      ongoing: [],
      done: [],
    };
    user.room.map((room) => {
      if (room.isOver) response.done.push(room);
      else response.ongoing.push(room);
    });
    res.json(response);
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/searchByUser : internal server error",
    });
  }
};

const idSettlementHandler = async (req, res) => {
  try {
    const user = await userModel.findOne({ id: req.userId });
    let result = await roomModel.findOneAndUpdate(
      { _id: req.params.id, "settlement.studentId": user._id },
      { "settlement.$.isSettlement": true, $inc: { settlementTotal: 1 } }
    );
    if (result) {
      let room = await roomModel.findById(req.params.id);
      if (room.settlementTotal === room.part.length) {
        room.isOver = true;
        await room.save();
      }
      res.send(result);
    } else {
      res.status(404).json({
        error: " cannot find settlement info",
      });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "/:id/settlement : internal server error",
    });
  }
};

const getAllRoomHandler = async (_, res) => {
  const result = await roomModel.find({}).populate(roomPopulateQuery).exec();
  res.json(result);
  return;
};

const removeAllRoomHandler = async (_, res) => {
  await roomModel.remove({});
  res.redirect("/rooms/getAllRoom");
  return;
};

const idEditHandler = async (req, res) => {
  const { name, from, to, time, part } = req.body;

  // 수정할 값이 주어지지 않은 경우
  if (!name && !from && !to && !time && !part) {
    res.status(400).json({
      error: "Rooms/edit : Bad request",
    });
    return;
  }

  let fromLoc = await locationModel.findOneAndUpdate(
    { name: from },
    {},
    { new: true, upsert: true }
  );
  let toLoc = await locationModel.findOneAndUpdate(
    { name: to },
    {},
    { new: true, upsert: true }
  );
  const changeJSON = {
    name: name,
    from: fromLoc._id,
    to: toLoc._id,
    time: time,
    part: part,
  };

  try {
    let result = await roomModel.findByIdAndUpdate(req.params.id, {
      $set: changeJSON,
      new: true,
    });
    if (result) {
      await result.execPopulate(roomPopulateQuery);
      res.send(result);
    } else {
      res.status(404).json({
        error: "Rooms/edit : id does not exist",
      });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/edit : internal server error",
    });
  }
};

const idDeleteHandler = async (req, res) => {
  try {
    const result = await roomModel.findByIdAndRemove(req.params.id).exec();
    if (result) {
      res.send({
        id: req.params.id,
        isDeleted: true,
      });
      return;
    } else {
      res.status(404).json({
        error: "Rooms/delete : ID does not exist",
      });
      return;
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/delete : internal server error",
    });
    return;
  }

  // catch는 반환값이 없을 경우(result == undefined일 때)는 처리하지 않는다.
};

module.exports = {
  infoHandler,
  createHandler,
  inviteHandler,
  abortHandler,
  searchHandler,
  searchByUserHandler,
  getAllRoomHandler,
  removeAllRoomHandler,
  idSettlementHandler,
  idEditHandler,
  idDeleteHandler,
};
