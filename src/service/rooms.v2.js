// ########################################################
// ############# Version 2 APIS FROM HERE #################
// ########################################################

const { roomModel, locationModel, userModel } = require("../db/mongo");
const { emitChatEvent } = require("../route/chats.socket");
const { leaveChatRoom } = require("../auth/login");
const logger = require("../modules/logger");

/** 쿼리를 통해 얻은 Room Document를 populate할 설정값을 정의합니다.
 */
const roomPopulateOption = [
  { path: "part", select: "_id id name nickname profileImageUrl" },
  { path: "from", select: "_id koName enName" },
  { path: "to", select: "_id koName enName" },
  {
    path: "settlement",
    select: "-_id studentId isSettlement",
    populate: { path: "studentId", select: "_id id name nickname" },
  },
];

/**
 * Room Object가 주어졌을 때 정산 여부를 클라이언트에서 읽기 쉬운 형태로 가공하고, 방이 현재 출발했는지 유무인 isDeparted 속성을 추가합니다.
 * @param {Object} roomObject - 정산 정보를 가공할 room Object로, Mongoose Document가 아닌 순수 Javascript Object여야 합니다.
 * @param {Boolean} [includeSettlement] - 반환 결과에 정산 정보를 포함할 지 여부로, 기본값은 true입니다.
 * @return {Object} 정산 여부가 처리하기 쉬운 형태로 가공되고, isDeparted 속성이 추가된 Room Object가 반환됩니다.
 */
const formatSettlement = (roomObject, includeSettlement = true) => {
  if (includeSettlement) {
    roomObject.settlement = roomObject.settlement.map((settlement) => {
      const { name, nickname, id } = settlement.studentId;
      return {
        name,
        nickname,
        id,
        isSettlement: settlement.isSettlement,
      };
    });
  } else {
    roomObject.settlement = undefined;
  }
  roomObject.isDeparted = new Date(roomObject.time) < new Date() ? true : false;
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

    // 입장 채팅을 보냅니다.
    await emitChatEvent(req.app.get("io"), room._id, {
      type: "in",
      content: user.id,
      authorId: user._id,
    });

    const roomObject = (await room.populate(roomPopulateOption)).toObject();
    res.status(200).json(formatSettlement(roomObject));
    return;
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
      .findOne({ _id: req.query.id, part: { $elemMatch: { $eq: user._id } } })
      .lean()
      .populate(roomPopulateOption);
    if (roomObject) {
      res.status(200).send(formatSettlement(roomObject));
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

    // 초대할 사람 수가 방의 남은 자리 수를 초과하면 초대가 불가능합니다.
    if (room.part.length + 1 > room.maxPartLength) {
      res.status(400).json({
        error: "Room/join : There are too many people to invite to the room",
      });
      return;
    }

    // 사용자가 이미 참여중인 방인 경우, req.body.users의 사용자들을 방에 참여시킵니다.
    if (room.part.includes(user._id)) {
      return res.status(409).json({
        error: "Rooms/join : " + user._id + " Already in room",
      });
    }

    // update room in newUsers
    room.part.push(user._id);
    user.room.push(room._id);
    room.settlement.push({ studentId: user._id, isSettlement: false });
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

const abortHandler = async (req, res) => {
  const time = Date.now();
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
    res.json(rooms.map((room) => formatSettlement(room)));
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
    user.room.map((room) => {
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
      const roomObject = (await result.populate(roomPopulateOption)).toObject();
      res.send(formatSettlement(roomObject));
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
  const rooms = await roomModel.find({}).lean().populate(roomPopulateOption);
  res.json(rooms.map((room) => formatSettlement(room)));
  return;
};

const removeAllRoomHandler = async (_, res) => {
  await roomModel.remove({});
  res.redirect("/rooms/getAllRoom");
  return;
};

const idEditHandler = async (req, res) => {
  const { name, from, to, time, part, maxPartLength } = req.body;

  // 수정할 값이 주어지지 않은 경우
  if (!name && !from && !to && !time && !part && !maxPartLength) {
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
  if (part) changeJSON.part = part;
  if (maxPartLength) changeJSON.maxPartLength = maxPartLength;

  try {
    let result = await roomModel.findByIdAndUpdate(req.params.id, {
      $set: changeJSON,
      new: true,
    });
    if (result) {
      const roomObject = (await result.populate(roomPopulateOption)).toObject();
      res.send(formatSettlement(roomObject));
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
  joinHandler,
  abortHandler,
  searchHandler,
  searchByUserHandler,
  getAllRoomHandler,
  removeAllRoomHandler,
  idSettlementHandler,
  idEditHandler,
  idDeleteHandler,
};
