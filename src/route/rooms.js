const express = require("express");
const router = express.Router();
const loginCheckMiddleware = require("../middleware/logincheck");
const { roomModel, locationModel, userModel } = require("../db/mongo")
//const taxiResponse = require('../taxiResponse')


// router.use(loginCheckMiddleware);

const removeLocationId = async (room) => {
  const { _id, from: fromId, to: toId, name, time, part, madeat } = room;
  const from = await locationModel.findById(fromId);
  const to = await locationModel.findById(toId);
  return { _id, from: from.name, to: to.name, name, part, madeat, time };
}

// ONLY FOR TEST
router.get("/getAllRoom", async (_, res) => {
  console.log("GET ALL ROOM");
  const result = await roomModel.find({});
  res.send(result);
  return;
});

// ONLY FOR TEST
router.get("/removeAllRoom", async (_, res) => {
  console.log("DELETE ALL ROOM");
  await roomModel.remove({});
  res.redirect("/rooms/getAllRoom");
  return;
});

// request JSON form
// name : String
// from : String
// to : String
// time : Date
// part : Array
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

    let room = new roomModel({
      name: name,
      from: fromLoc._id,
      to: toLoc._id,
      time: time,
      part: part,
      madeat: Date.now(),
    });
    await room.save();
    console.log(room)
    res.send(await removeLocationId(room));
    return;
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Rooms/create : internal server error",
    });
    return;
  }
});

// test method
// requestJSON
// { id : {id} }
router.post("/roominfo", async (req, res) => {
  if (!req.body.id) res.status("400").send("Room/roominfo : Bad request");
  try {
    const room = await roomModel.findById(req.body.id)
    if (room) {
      res.json(removeLocationId(room));
    } else {
      console.log("room info error : id does not exist");
      res.status(404).send("such id does not exist");
    }
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal server error");
  }
});

// Request JSON form
// { roomId : ObjectID,
//   users : List[ObjectID] }
router.post("/invite", async (req, res) => {
  // Request JSON Validation
  if (!req.body.roomId || !req.body.users)
    res.status("400").json({
      error: "Room/invite : Bad request",
    });
  try {
    let room = await roomModel.findById(req.body.roomId);
    if (!room)
      res.status(404).json({
        error: "Room/invite : no corresponding room",
      });
    for (const userID of req.body.users) {
      if (room.part.includes(userID))
        res.status("409").json({
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
    res.send(removeLocationId(room));
  } catch (error) {
    console.log(error);
    res.status("500").json({
      error: "Room/invite : internal server error",
    });
  }
});

// Request JSON Form
// {
//   fromName : String,
//   toName : String,
//   startDate : Date,
// }

router.get("/searchByName/:name", async (req, res) => {
  if (!req.params.name) {
    res.status("400").json({
      error: "Room/searchByName : Bad request",
    });
  }

  try {
    let room = await roomModel.findOne({ name: req.params.name });
    if (!room) {
      res.status("404").json({
        error: "Room/searchByName : No matching room",
      });
    }
    res.send(removeLocationId(room));
  } catch (err) {
    console.log(err);
    res.status("500").json({
      error: "Room/searchByName : Internal server error",
    });
  }
});

// fromName, toName은 필수
// startDate는 선택

// 동명의 지역은 불가능
router.get("/search", async (req, res) => {
  const { from, to, time } = req.query;
  console.log(req.query);
  if (!from && !to) {
    res.status("400").json({
      error: "Room/search : Bad request",
    });
    return;
  }

  try {
    const fromLocation = await locationModel.findOne({ name: from })
    const toLocation = await locationModel.findOne({ name: to })

    if ((from && !fromLocation) || (to && !toLocation)) {
      res.status("404").json({
        error: "Room/search : No corresponding location",
      });
      return;
    }
    const query = {};
    if (fromLocation) query.from = fromLocation._id;
    if (toLocation) query.to = toLocation._id;
    if (time) query.time = { $gte: new Date(time) };

    const rooms = await roomModel.find(query);
    res.json(await Promise.all(rooms.map(room => removeLocationId(room))));
  } catch (error) {
    console.log(error);
    res.status("500").json({
      error: "Room/search : Internal server error",
    });
  }
});

// json으로 수정할 값들을 받는다
// json 형식이 맞는지 검증해야 함
// request JSON
// name, from, to, time, part
router.post("/:id/edit", async (req, res) => {
  // #FIXME 하드코딩, map reduce으로 어케 안되나?
  const { name, from, to, time, part } = req.body;
  if (name || from || to || time || part) {
    res.status("400").json({
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
      res.send(removeLocationId(result));
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
    const result = await roomModel
      .findByIdAndRemove(req.params.id)
      .exec();
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
      error: "Rooms/create : internal server error",
    });
    return;
  }

  // catch는 반환값이 없을 경우(result == undefined일 때)는 처리하지 않는다.
});


// 특정 id 방 세부사항 보기
router.get("/:id", async (req, res) => {
  try {
    let room = await roomModel.findById(req.params.id);
    if (roomModel) {
      res.status(200).send(removeLocationId(room));
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



module.exports = router;