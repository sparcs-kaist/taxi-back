const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { roomModel, locationModel, userModel } = require("../db/mongo");
//const taxiResponse = require('../taxiResponse')

router.use(authMiddleware);

// 출발지와 도착지의 ObjectId 지우기 (아래 코드로 대체되어 다음 커밋에서 삭제될 예정)
// const removeLocationId = async (room) => {
//   const { _id, from: fromId, to: toId, name, time, part, madeat } = room;
//   const from = await locationModel.findById(fromId);
//   const to = await locationModel.findById(toId);
//   return { _id, from: from.name, to: to.name, name, part, madeat, time };
// };

const extractLocationName = (location) => location.name;

const roomPopulateQuery = [
  { path: "part", select: "id name nickname -_id" },
  { path: "from", transform: extractLocationName },
  { path: "to", transform: extractLocationName },
];

// 특정 id 방 세부사항 보기
router.get("/:id/info", async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(403).json({
      error: "room/info : not logged in",
    });
    return;
  }

  try {
    const user = await userModel.findOne({ id: userId });

    let room = await roomModel.findById(req.params.id);
    if (room) {
      // 사용자가 해당 룸의 구성원이 아닌 경우, 403 오류를 반환한다.
      if (room.part.indexOf(user._id) === -1) {
        res.status(403).json({
          error: "Rooms/info : did not joined the room",
        });
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
    console.log(err);
    res.status(500).json({
      error: "Rooms/info : internal server error",
    });
  }
});

// JSON으로 받은 정보로 방을 생성한다.
// 연도가 2001년으로 뜨는데 어디 문제지...
router.post("/create", async (req, res) => {
  const { name, from, to, time, part } = req.body.data;
  if (!name || !from || !to || !time) {
    res.status(400).json({
      error: "Rooms/create : bad request",
    });
    return;
  }

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

    // 방 생성 요청을 한 사용자의 ObjectID를 room의 part 리스트에 추가
    const user = await userModel.findOne({ id: req.userId });
    part.push(user._id);

    let room = new roomModel({
      name: name,
      from: fromLoc._id,
      to: toLoc._id,
      time: time,
      part: part,
      madeat: Date.now(),
    });
    await room.save();

    // 방의 ObjectID를 방 생성 요청을 한 사용자의 room 배열에 추가
    user.room.push(room._id);
    await user.save();

    room.execPopulate(roomPopulateQuery);
    res.send(room);
    return;
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Rooms/create : internal server error",
    });
    return;
  }
});

// 새로운 사용자를 방에 참여시킨다. (검증 안됨)
router.post("/invite", async (req, res) => {
  // Request JSON Validation
  if (!req.body.roomId || !req.body.users) {
    console.log(req.body.roomId, req.body.users);
    res.status(400).json({
      error: "Room/invite : Bad request",
    });
    return;
  }
  try {
    let room = await roomModel.findById(req.body.roomId);
    if (!room)
      res.status(404).json({
        error: "Room/invite : no corresponding room",
      });
    for (const userID of req.body.users) {
      if (room.part.includes(userID))
        res.status(409).json({
          error: "Room/invite : " + userID + " Already in room",
        });
    }
    for (const userID of req.body.users) {
      room.part = room.part.concat(userID);
      await room.save();
      let user = await userModel.findById(userID);
      user.room = user.room.concat(req.body.roomId);
      user.save();
    }
    await room.execPopulate(roomPopulateQuery);
    res.send(room);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Room/invite : internal server error",
    });
  }
});

// 기존 방에서 나간다. (검증 안됨: 방 주인이 바뀌는 경우.)
// request: {roomId: 나갈 방}
// result: Room
// 모든 사람이 나갈 경우 방 삭제!
router.post("/abort", async (req, res) => {
  // Request JSON Validation
  if (!req.body.roomId) {
    res.status(400).json({
      error: "Room/abort : Bad request",
    });
    return;
  }

  try {
    let room = await roomModel.findById(req.body.roomId);
    if (!room) {
      res.status(404).json({
        error: "Room/abort : no corresponding room",
      });
      return;
    }
    let user = await userModel.findOne({ id: req.userId });
    if (!user) {
      res.status(400).json({
        error: "Room/abort : Bad request",
      });
      return;
    }

    // 사용자가 참여중인 방 목록에서 해당 방을 제거하고, 해당 방의 참여자 목록에서 사용자를 제거한다.
    // 사용자가 해당 룸의 구성원이 아닌 경우, 403 오류를 반환한다.
    console.log(room.part, user._id);
    console.log(user.room, room._id);
    const roomPartIndex = room.part.indexOf(user._id);
    const userRoomIndex = user.room.indexOf(room._id);
    if (roomPartIndex === -1 || userRoomIndex === -1) {
      res.status(403).json({
        error: "Rooms/info : did not joined the room",
      });
      return;
    } else {
      room.part.splice(roomPartIndex, 1);
      user.room.splice(userRoomIndex, 1);
      await user.save();
      if (room.part.length !== 0) await room.save();
      else {
        //남은 사용자가 없는 경우.
        await room.remove();
      }
    }
    await room.execPopulate(roomPopulateQuery);
    res.send(room);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Room/abort : internal server error",
    });
  }
});

// 조건(출발지, 도착지, 날짜)에 맞는 방들을 모두 반환한다.
router.get("/search", async (req, res) => {
  const { from, to, time } = req.query;
  // console.log(req.query);

  if (!from && !to) {
    res.status(400).json({
      error: "Room/search : Bad request",
    });
    return;
  }

  try {
    const fromLocation = await locationModel.findOne({ name: from });
    const toLocation = await locationModel.findOne({ name: to });

    // 동명의 지역은 불가능
    if ((from && !fromLocation) || (to && !toLocation)) {
      res.status(404).json({
        error: "Room/search : No corresponding location",
      });
      return;
    }
    const query = {};
    if (fromLocation) query.from = fromLocation._id;
    if (toLocation) query.to = toLocation._id;
    if (time) query.time = { $gte: new Date(time) };

    const rooms = await roomModel
      .find(query)
      .populate(roomPopulateQuery)
      .exec();
    res.json(rooms);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Room/search : Internal server error",
    });
  }
});

// 해당 이름과 일치하는 방을 반환한다.
router.get("/searchByName/:name", async (req, res) => {
  if (!req.params.name) {
    res.status(400).json({
      error: "Room/searchByName : Bad request",
    });
  }

  try {
    let rooms = await roomModel
      .find({ name: req.params.name })
      .populate(roomPopulateQuery)
      .exec();
    if (!rooms) {
      res.status(404).json({
        error: "Room/searchByName : No matching room(s)",
      });
    }
    res.json(rooms);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Room/searchByName : Internal server error",
    });
  }
});

// 로그인된 사용자의 모든 방들을 반환한다.
router.get("/searchByUser/", async (req, res) => {
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
      .exec();
    res.json(user.room);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Rooms/searchByUser : internal server error",
    });
  }
});

// THE ROUTES BELOW ARE ONLY FOR TEST
router.get("/getAllRoom", async (_, res) => {
  console.log("GET ALL ROOM");
  const result = await roomModel.find({}).populate(roomPopulateQuery).exec();
  res.json(result);
  return;
});

router.get("/removeAllRoom", async (_, res) => {
  console.log("DELETE ALL ROOM");
  await roomModel.remove({});
  res.redirect("/rooms/getAllRoom");
  return;
});

// json으로 수정할 값들을 받는다
// json 형식이 맞는지 검증해야 함
// request JSON
// name, from, to, time, part
router.post("/:id/edit", async (req, res) => {
  // #FIXME 하드코딩, map reduce으로 어케 안되나?
  const { name, from, to, time, part } = req.body;
  if (name || from || to || time || part) {
    res.status(400).json({
      error: "Rooms/edit : Bad request",
    });
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
    console.log(result);
    if (result) {
      await result.execPopulate(roomPopulateQuery);
      res.send(result);
    } else {
      res.status(404).json({
        error: "Rooms/edit : id does not exist",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Rooms/edit : internal server error",
    });
  }
});

router.get("/:id/delete", async (req, res) => {
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
    console.log(err);
    res.status(500).json({
      error: "Rooms/delete : internal server error",
    });
    return;
  }

  // catch는 반환값이 없을 경우(result == undefined일 때)는 처리하지 않는다.
});

module.exports = router;
