const express = require("express");
const router = express.Router();
const loginCheckMiddleware = require("../middleware/logincheck");
const { roomModel, locationModel, userModel } = require("../db/mongo")
//const taxiResponse = require('../taxiResponse')

module.exports = () => {
  router.use(loginCheckMiddleware);

  // ONLY FOR TEST
  router.get("/getAllRoom", async (_, res) => {
    console.log("GET ALL ROOM");
    const result = await roomModel.find({}).exec();
    res.send(JSON.parse(JSON.stringify(result)));
    return;
  });

  // ONLY FOR TEST
  router.get("/removeAllRoom", async (_, res) => {
    console.log("DELETE ALL ROOM");
    await roomModel.remove({}).exec();
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
    if (!req.body.name || !req.body.from || !req.body.to || !req.body.time) {
      res.status(400).json({
        error: "Rooms/create : bad request",
      });
      return;
    }

    try {
      let from = await locationModel.findOneAndUpdate(
        { name: req.body.from },
        {},
        { new: true, upsert: true }
      );
      let to = await locationModel.findOneAndUpdate(
        { name: req.body.to },
        {},
        { new: true, upsert: true }
      );

      let room = new roomModel({
        name: req.body.name,
        from: from._id,
        to: to._id,
        time: req.body.time,
        part: req.body.part,
        madeat: Date.now(),
      });
      await room.save();
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

  // json으로 수정할 값들을 받는다
  // json 형식이 맞는지 검증해야 함
  // request JSON
  // name, from, to, time, part
  router.post("/:id/edit", async (req, res) => {
    // #FIXME 하드코딩, map reduce으로 어케 안되나?
    if (
      !req.body.name ||
      !req.body.from ||
      !req.body.to ||
      !req.body.time ||
      !req.body.part
    ) {
      res.status("400").json({
        error: "Rooms/edit : Bad request",
      });
    }
    let from = await locationModel.findOneAndUpdate(
      { name: req.body.from },
      {},
      { new: true, upsert: true }
    );
    let to = await locationModel.findOneAndUpdate(
      { name: req.body.to },
      {},
      { new: true, upsert: true }
    );
    const changeJSON = {
      name: req.body.name,
      from: from,
      to: to,
      time: req.body.time,
      part: req.body.part,
    };

    try {
      let result = await roomModel.findByIdAndUpdate(req.params.id, {
        $set: changeJSON,
        new: true,
      });
      console.log(result);
      if (result) {
        res.send(changeJSON);
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

  // 특정 id 방 세부사항 보기
  router.get("/:id", async (req, res) => {
    try {
      let result = await roomModel.findById(req.params.id);
      if (result) {
        res.status(200).send(result);
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

  // test method
  // requestJSON
  // { id : {id} }
  router.post("/roominfo", (req, res) => {
    if (!req.body.id) res.status("400").send("Room/roominfo : Bad request");
    roomModel
      .findById(req.body.id)
      .then((result) => {
        if (result) {
          console.log(JSON.stringify(result));
          res.send(JSON.stringify(result));
        } else {
          console.log("room info error : id does not exist");
          res.status(400).send("such id does not exist");
        }
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
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
      res.send(room);
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
      res.send(room);
    } catch (err) {
      console.log(err);
      res.status("500").json({
        error: "Room/searchByName : Internal server error",
      });
    }
  });

  // fromName, toName은 필수
  // startDate는 선택
  router.post("/search", async (req, res) => {
    if (!req.body.fromName && !req.body.toName) {
      res.status("400").json({
        error: "Room/search : Bad request",
      });
      return;
    }

    try {
      const fromLocationID = req.body.fromName
        ? await locationModel.findOne({ name: req.body.fromName })?._id
        : null;
      const toLocationID = req.body.toName
        ? await locationModel.findOne({ name: req.body.toName })?._id
        : null;

      if (!fromLocationID || !toLocationID) {
        res.status("404").json({
          error: "Room/search : No corresponding location",
        });
        return;
      }

      let rooms;
      if (!req.body.startDate) {
        rooms = await roomModel.find({
          from: fromLocationID,
          to: toLocationID,
        });
      } else {
        rooms = await roomModel.find({
          from: fromLocationID,
          to: toLocationID,
          time: { $gte: new Date(req.body.startDate) },
        });
      }
      // date form 2012-04-23T18:25:43.511Z
      rooms.from = (await locationModel.findById(fromLocationID)).name;
      rooms.to = (await locationModel.findById(toLocationID)).name;
      res.send({
        data: rooms,
      });
    } catch (error) {
      console.log(error);
      res.status("500").json({
        error: "Room/search : Internal server error",
      });
    }
  });

  return router;
};
