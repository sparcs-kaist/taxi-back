const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { roomModel, locationModel, userModel } = require("../db/mongo");
const { query, param, body, validationResult } = require("express-validator");
//const taxiResponse = require('../taxiResponse')

// 라우터 접근 시 로그인 필요
router.use(authMiddleware);

// 입력 데이터 검증을 위한 정규 표현식들
const patterns = {
  name: RegExp("^[A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ,.?! _-]{1,50}$"),
  from: RegExp("^[A-Za-z0-9가-힣 -]{1,30}$"),
  to: RegExp("^[A-Za-z0-9가-힣 -]{1,30}$"),
};

// 장소, 참가자 목록의 ObjectID 제거하기
const extractLocationName = (location) => location.name;
const roomPopulateQuery = [
  { path: "part", select: "id name nickname -_id" },
  { path: "from", transform: extractLocationName },
  { path: "to", transform: extractLocationName },
];

// 특정 id 방 세부사항 보기
router.get("/info", query("id").isMongoId(), async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(403).json({
      error: "Rooms/info : not logged in",
    });
    return;
  }

  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    res.status(404).json({
      error: "Rooms/info : id does not exist",
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
    console.log(err);
    res.status(500).json({
      error: "Rooms/info : internal server error",
    });
  }
});

// JSON으로 받은 정보로 방을 생성한다.
// FIXME: {data: JSON} -> {JSON} 로 API 단순화하기,
router.post(
  "/create",
  [
    body("name").matches(patterns.name),
    body("from").matches(patterns.from),
    body("to").matches(patterns.to),
    body("time").isISO8601(),
  ],
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({
        error: "Rooms/create : bad request",
      });
      return;
    }

    const { name, from, to, time } = req.body;

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
  }
);

// 새로운 사용자를 방에 참여시킨다.
// FIXME: req.body.users 검증할 때 SSO ID 규칙 반영하기
router.post(
  "/invite",
  [
    body("roomId").isMongoId(),
    body("users").isArray(),
    body("users.*").isLength({ min: 1, max: 30 }).isAlphanumeric(),
  ],
  async (req, res) => {
    // Request JSON Validation
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({
        error: "Rooms/invite : Bad request",
      });
      return;
    }

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
          newUsers.push(newUser);
        }

        for (let newUser of newUsers) {
          room.part.push(newUser._id);
          newUser.room.push(room._id);
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
        room.part.push(user._id);
        user.room.push(room._id);
        await user.save();
      }

      await room.save();
      await room.execPopulate(roomPopulateQuery);
      res.send(room);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: "Rooms/invite : internal server error",
      });
    }
  }
);

// 기존 방에서 나간다. (채팅 이벤트 연동 안됨: 방 주인이 바뀌는 경우.)
// request: {roomId: 나갈 방}
// result: Room
// 모든 사람이 나갈 경우 방 삭제.
router.post("/abort", body("roomId").isMongoId(), async (req, res) => {
  // Request JSON Validation
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    res.status(400).json({
      error: "Rooms/abort : Bad request",
    });
    return;
  }

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
      error: "Rooms/abort : internal server error",
    });
  }
});

// 조건(출발지, 도착지, 날짜)에 맞는 방들을 모두 반환한다.
router.get(
  "/search",
  [
    query("from").matches(patterns.from),
    query("to").matches(patterns.to),
    query("time").optional().isISO8601(),
  ],
  async (req, res) => {
    const { from, to, time } = req.query;
    // console.log(req.query);

    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({
        error: "Rooms/search : Bad request",
      });
      return;
    }

    try {
      const fromLocation = await locationModel.findOne({ name: from });
      const toLocation = await locationModel.findOne({ name: to });

      // 동명의 지역은 불가능
      if ((from && !fromLocation) || (to && !toLocation)) {
        res.status(404).json({
          error: "Rooms/search : No corresponding location",
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
        error: "Rooms/search : Internal server error",
      });
    }
  }
);

// 해당 이름과 일치하는 방을 반환한다.
router.get(
  "/searchByName/",
  query("name").matches(patterns.name),
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({
        error: "Rooms/searchByName : Bad request",
      });
      return;
    }

    try {
      let rooms = await roomModel
        .find({ name: req.query.name })
        .populate(roomPopulateQuery)
        .exec();
      if (!rooms) {
        res.status(404).json({
          error: "Rooms/searchByName : No matching room(s)",
        });
      }
      res.json(rooms);
    } catch (err) {
      console.log(err);
      res.status(500).json({
        error: "Rooms/searchByName : Internal server error",
      });
    }
  }
);

// 로그인된 사용자의 모든 방들을 반환한다.
router.get("/searchByUser/", async (req, res) => {
  // 방이 서버 시간을 기준으로 완료되었는지(출발 시간이 지났는지) 확인하는 함수
  const isOver = (room, time) => {
    if (new Date(room.time) <= time) return true;
    else return false;
  };

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

    // 시각을 기준으로 진행중인 방과 완료된 방을 분리해서 응답을 전송합니다.
    const time = Date.now();
    const response = {
      ongoing: [],
      done: [],
    };
    user.room.map((room) => {
      if (isOver(room, time)) response.done.push(room);
      else response.ongoing.push(room);
    });
    res.json(response);
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

// json으로 수정할 값들을 받아 방의 정보를 수정합니다.
// request JSON
// name, from, to, time, part
// FIXME: req.body.users 검증할 때 SSO ID 규칙 반영하기
router.post(
  "/:id/edit",
  [
    body("name").optional().matches(patterns.name),
    body("from").optional().matches(patterns.from),
    body("to").optional().matches(patterns.to),
    body("time").optional().isISO8601(),
    body("part").isArray(),
    body("part.*").optional().isLength({ min: 1, max: 30 }).isAlphanumeric(),
  ],
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({
        error: "Rooms/edit : Bad request",
      });
      return;
    }

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
  }
);

// FIXME: 방장만 삭제 가능.
router.get("/:id/delete", param("id").isMongoId(), async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    res.status(404).json({
      error: "Rooms/delete : ID does not exist",
    });
    return;
  }

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
