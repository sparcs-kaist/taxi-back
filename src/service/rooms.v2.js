// ########################################################
// ############# Version 2 APIS FROM HERE #################
// ########################################################

const { roomModel, locationModel, userModel } = require("../db/mongo");
const { emitChatEvent } = require("../route/chats.socket");
const { leaveChatRoom } = require("../auth/login");
const logger = require("../modules/logger");

/** @constant {{path: string, select: string, populate?: {path: string, select: string}}[]}
 * 쿼리를 통해 얻은 Room Document를 populate할 설정값을 정의합니다.
 */
const roomPopulateOption = [
  { path: "from", select: "_id koName enName" },
  { path: "to", select: "_id koName enName" },
  {
    path: "part",
    select: "-_id user settlementStatus",
    populate: { path: "user", select: "_id id name nickname profileImageUrl" },
  },
];

/**
 * Room Object가 주어졌을 때 room의 part array의 각 요소를 API 명세에서와 같이 {userId: String, ... , settlementStatus: String}으로 가공합니다.
 * 또한, 방이 현재 출발했는지 유무인 isDeparted 속성을 추가합니다.
 * @param {Object} roomObject - 정산 정보를 가공할 room Object로, Mongoose Document가 아닌 순수 Javascript Object여야 합니다.
 * @param {Boolean} includeSettlement - 반환 결과에 정산 정보를 포함할 지 여부로, 기본값은 true입니다.
 * @return {Object} 정산 여부가 위와 같이 가공되고 isDeparted 속성이 추가된 Room Object가 반환됩니다.
 */
const formatSettlement = (roomObject, includeSettlement = true) => {
  roomObject.part = roomObject.part.map((participantSubDocument) => {
    const { _id, name, nickname, profileImageUrl } =
      participantSubDocument.user;
    const { settlementStatus } = participantSubDocument;
    return {
      _id,
      name,
      nickname,
      profileImageUrl,
      isSettlement: includeSettlement ? settlementStatus : undefined,
    };
  });
  roomObject.settlementTotal = includeSettlement
    ? roomObject.settlementTotal
    : undefined;
  roomObject.isOver = includeSettlement ? roomObject.isOver : undefined;
  return roomObject;
};

const createHandler = async (req, res) => {
  const { name, from, to, time, maxPartLength } = req.body;

  try {
    if (from === to) {
      return res.status(400).json({
        error: "Room/create : locations are same",
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
    const user = await userModel.findOne({ id: req.userId });
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
      isOver: false,
    });
    await room.save();

    // 방의 ObjectID를 방 생성 요청을 한 사용자의 room 배열에 추가
    user.room.push(room._id);
    await user.save();

    // 입장 채팅을 보냅니다.
    await emitChatEvent(req.app.get("io"), room._id, {
      type: "in",
      content: user.id,
      authorId: user._id,
    });

    const roomObject = (await room.populate(roomPopulateOption)).toObject();
    return res.send(formatSettlement(roomObject));
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/create : internal server error",
    });
    return;
  }
};

const infoHandler = async (req, res) => {
  try {
    const user = await userModel.findOne({ id: req.userId });
    const roomObject = await roomModel
      .findOne({ _id: req.query.id, "part.user": user._id })
      .lean()
      .populate(roomPopulateOption);
    if (roomObject) {
      res.send(formatSettlement(roomObject));
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
    const user = await userModel.findOne({ id: req.userId });
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
        error: "Room/join : The room has already departed",
      });
      return;
    }

    // 방의 인원이 모두 찬 경우, 400 오류를 반환합니다.
    if (room.part.length + 1 > room.maxPartLength) {
      res.status(400).json({
        error: "Room/join : The room is already full",
      });
      return;
    }

    room.part.push({ user: user._id });
    user.room.push(room._id);
    await user.save();
    await room.save();

    // 입장 채팅을 보냅니다.
    await emitChatEvent(req.app.get("io"), room._id, {
      type: "in",
      content: user.id,
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

/**
 * @todo 삭제할 유저 인덱스 더 쉽게 파악하기
 */
const abortHandler = async (req, res) => {
  const isOvertime = (room, time) => {
    if (new Date(room.time) <= time) return true;
    else return false;
  };

  try {
    const user = await userModel.findOne({ id: req.userId });
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

    // 사용자가 채팅방에 들어와있는 경우, 소켓 연결을 먼저 끊습니다.
    if (req.session.socketId && req.session.chatRoomId) {
      req.app.get("io").in(req.session.socketId).disconnectSockets(true);
      leaveChatRoom({ session: req.session });
    }

    // 사용자가 참여중인 방 목록에서 해당 방을 제거하고, 해당 방의 참여자 목록에서 사용자를 제거합니다.
    // 사용자가 해당 룸의 구성원이 아닌 경우, 403 오류를 반환합니다.
    const roomPartIndex = room.part
      .map((part) => part.user.toString())
      .indexOf(user._id.toString());
    const userRoomIndex = user.room.indexOf(room._id);
    if (roomPartIndex === -1 || userRoomIndex === -1) {
      res.status(403).json({
        error: "Rooms/info : did not joined the room",
      });
      return;
    } else {
      // 방의 출발시간이 지나고 정산이 되지 않으면 나갈 수 없음
      if (isOvertime(room, req.timestamp) && !room.isOver) {
        res.status(400).json({
          error: "Rooms/info : cannot exit room. Settlement is not done",
        });
        return;
      }
      room.part.splice(roomPartIndex, 1);
      user.room.splice(userRoomIndex, 1);
      await user.save();
      await room.save();
      if (room.part.length <= 0) {
        // 남은 사용자가 없는 경우.
        // FIXME : 채팅을 지워야 하고, 남은 뒷부분 코드 때문에 문제가 될 수 있을 것 같음
        // await room.remove();
      }
    }

    // 퇴장 채팅을 보냅니다.
    await emitChatEvent(req.app.get("io"), room._id, {
      type: "out",
      content: user.id,
      authorId: user._id,
    });
    const roomObject = (await room.populate(roomPopulateOption)).toObject();
    res.send(formatSettlement(roomObject));
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

  try {
    const { name, from, to, time, maxPartLength } = req.query;

    // 출발지와 도착지가 같은 경우
    if (from && to && from === to) {
      res.status(400).json({
        error: "Room/search : Bad request",
      });
      return;
    }

    // 출발지나 도착지가 존재하지 않는 장소일 경우
    if (from) {
      const fromLocation = await locationModel.findById(from);
      if (!fromLocation) {
        return res.status(400).json({
          error: "Room/search : no corresponding locations",
        });
      }
    }
    if (to) {
      const toLocation = await locationModel.findById(to);
      if (!toLocation) {
        return res.status(400).json({
          error: "Room/search : no corresponding locations",
        });
      }
    }

    const minTime = time ? new Date(time) : new Date();
    // 요청이 서버 시각 기준 1분 전에 왔으면 해당 요청을 유효하지 않은 것으로 처리합니다.
    if (!isRequestUnder1min(minTime)) {
      return res.status(400).json({
        error: "Room/search : Bad request",
      });
    }

    // 검색 시간대는 시작 시각으로부터 24시간으로 설정합니다.
    const maxTime = new Date(minTime).setTime(
      minTime.getTime() + 24 * 60 * 60 * 1000
    );

    // 검색 쿼리를 설정합니다.
    const query = {};
    if (name) query.name = { $regex: new RegExp(name, "i") }; // 'i': 대소문자 무시
    if (from) query.from = from;
    if (to) query.to = to;

    query.time = { $gte: minTime, $lt: maxTime };
    if (maxPartLength) query.maxPartLength = { $eq: maxPartLength };

    const rooms = await roomModel
      .find(query)
      .sort({ time: 1 })
      .populate(roomPopulateOption)
      .lean();
    res.json(rooms.map((room) => formatSettlement(room, false)));
  } catch (err) {
    res.status(500).json({
      error: "Rooms/search : Internal server error",
    });
  }
};

const searchByUserHandler = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ id: req.userId })
      .populate({
        path: "room",
        populate: roomPopulateOption,
      })
      .lean();

    // 정산완료여부 기준으로 진행중인 방과 완료된 방을 분리해서 응답을 전송합니다.
    const response = {
      ongoing: [],
      done: [],
    };
    user.room.forEach((room) => {
      room = formatSettlement(room);
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

const commitPaymentByIdHandler = async (req, res) => {
  try {
    const user = await userModel.findOne({ id: req.userId });
    const roomObject = await roomModel
      .findOneAndUpdate(
        {
          _id: req.params.id,
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

    if (roomObject) {
      res.send(formatSettlement(roomObject));
    } else {
      return res.status(404).json({
        error: "Rooms/:id/commitPayment : cannot find settlement info",
      });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/:id/commitPayment : internal server error",
    });
  }
};

const settlementByIdHandler = async (req, res) => {
  try {
    const roomId = req.params.id;
    const user = await userModel.findOne({ id: req.userId });
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
    if (roomObject) {
      if (roomObject.settlementTotal === roomObject.part.length) {
        roomObject = await roomModel
          .findByIdAndUpdate(roomId, { isOver: true }, { new: true })
          .lean()
          .populate(roomPopulateOption);
      }
      res.send(formatSettlement(roomObject));
    } else {
      res.status(404).json({
        error: "Rooms/:id/settlement : cannot find settlement info",
      });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/:id/settlement : internal server error",
    });
  }
};

/**
 * @todo Unused -> Remove
 */
const editByIdHandler = async (req, res) => {
  const { name, from, to, time, maxPartLength } = req.body;
  // 수정할 값이 주어지지 않은 경우
  if (!name && !from && !to && !time && !maxPartLength) {
    res.status(400).json({
      error: "Rooms/edit : Bad request",
    });
    return;
  }

  // 출발지와 도착지가 같은 경우
  if (from && to && from === to) {
    return res.status(400).json({
      error: "Rooms/edit : Bad request",
    });
  }

  // Room update query에 사용할 filter입니다.
  // 방에 참여중인 인원만 방 정보를 수정할 수 있습니다.
  const user = await userModel.findOne({ id: req.userId }, "_id");
  const roomFilter = {
    _id: req.params.id,
    part: {
      $elemMatch: {
        user: user._id,
      },
    },
  };

  const changeJSON = {};
  if (name) changeJSON.name = name;
  if (from) {
    const fromLoc = await locationModel.findById(from);
    if (!fromLoc)
      return res.status(400).json({
        error: "Rooms/edit : Bad request",
      });
    changeJSON.from = from;
  }
  if (to) {
    const toLoc = await locationModel.findById(to);
    if (!toLoc)
      return res.status(400).json({
        error: "Rooms/edit : Bad request",
      });
    changeJSON.to = to;
  }
  if (time) changeJSON.time = time;
  if (maxPartLength) {
    changeJSON.maxPartLength = maxPartLength;

    // 현재 참여 인원보다 최대 인원 수를 작게 설정할 수 없습니다.
    roomFilter[`part.${maxPartLength}`] = { $exists: false };
  }

  try {
    // 방 정보를 요청받은 것과 같이 수정합니다.
    let result = await roomModel.findOneAndUpdate(roomFilter, changeJSON, {
      new: true,
    });
    if (result) {
      const roomObject = (await result.populate(roomPopulateOption)).toObject();
      res.send(formatSettlement(roomObject));
    } else {
      res.status(404).json({
        error: "Rooms/edit : such room not exist",
      });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/edit : internal server error",
    });
  }
};

/**
 * @todo Unused -> Remove
 */
const getAllRoomHandler = async (_, res) => {
  try {
    const rooms = await roomModel.find({}).lean().populate(roomPopulateOption);
    return res.json(rooms.map((room) => formatSettlement(room)));
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "Rooms/getAllRoom : internal server error",
    });
  }
};

/**
 * @todo Unused -> Remove
 */
const removeAllRoomHandler = async (_, res) => {
  try {
    await roomModel.remove({});
    return res.redirect("/rooms/getAllRoom");
  } catch (err) {
    logger.log(err);
    res.status(500).json({
      error: "Rooms/getAllRoom : internal server error",
    });
  }
};

/**
 * @todo Unused -> Remove
 */
const deleteByIdHandler = async (req, res) => {
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
  joinHandler,
  abortHandler,
  searchHandler,
  searchByUserHandler,
  commitPaymentByIdHandler,
  settlementByIdHandler,
  editByIdHandler,
  getAllRoomHandler,
  removeAllRoomHandler,
  deleteByIdHandler,
};
