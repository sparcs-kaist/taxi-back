const { roomModel, locationModel, userModel } = require("../db/mongo");
const { query, param, body, validationResult } = require("express-validator");
const { urlencoded } = require("body-parser");
//const taxiResponse = require('../taxiResponse')

// 장소, 참가자 목록의 ObjectID 제거하기
const extractLocationName = (location) => location.name;
const roomPopulateQuery = [
  { path: "part", select: "id name nickname -_id" },
  { path: "from", transform: extractLocationName },
  { path: "to", transform: extractLocationName },
];


module.exports={
    infoHandler : async (req, res) => {
        const userId = req.userId;
        if (!userId) {
          res.status(403).json({
            error: "room/info : not logged in",
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
      
          let room = await roomModel.findById(req.params.id);
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
      },
    createHandler : async (req, res) => {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
          res.status(400).json({
            error: "Rooms/create : bad request",
          });
          return;
        }
    
        const { name, from, to, time } = req.body.data;
    
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
            settlement: {studentId : user._id, isSettlement: false},
            settlementTotal: 0,
            isOver: false
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
      },
    inviteHandler : async (req, res) => {
        // Request JSON Validation
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
          res.status(400).json({
            error: "Room/invite : Bad request",
          });
          return;
        }
    
        try {
          let user = await userModel.findOne({ id: req.userId });
          let room = await roomModel.findById(req.body.roomId);
          if (!room) {
            res.status(404).json({
              error: "Room/invite : no corresponding room",
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
                  error: "Room/invite : no corresponding user",
                });
                return;
              }
              if (room.part.includes(newUser._id)) {
                res.status(409).json({
                  error: "Room/invite : " + userID + " Already in room",
                });
                return;
              }
              newUsers.push(newUser);
            }
    
            for (let newUser of newUsers) {
              room.part.push(newUser._id);
              newUser.room.push(room._id);
              room.settlement.push({studentId : newUser._id, isSettlement: false});
              await newUser.save();
            }
          } else {
            // 사용자가 참여하지 않은 방의 경우, 사용자 자신만 참여하도록 요청했을 때에만 사용자를 방에 참여시킵니다.
            // 아닌 경우, 400 오류를 발생시킵니다.
            if (req.body.users.length != 1 || req.body.users[0] !== user.id) {
              res.status(400).json({
                error:
                  "Room/invite : You cannot invite other user(s) when you are not joining the room",
              });
              return;
            }
            room.part.push(user._id);
            user.room.push(room._id);
            room.settlement.push({studentId : user._id, isSettlement: false});
            await user.save();
          }
    
          await room.save();
          await room.execPopulate(roomPopulateQuery);
          res.send(room);
        } catch (error) {
          console.log(error);
          res.status(500).json({
            error: "Room/invite : internal server error",
          });
        }
      },
    abortHandler : async (req, res) => {
        // Request JSON Validation
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
          res.status(400).json({
            error: "Room/abort : Bad request",
          });
          return;
        }
      
        const time = Date.now();
        const isOvertime= (room, time) => {
          if (new Date(room.time) <= time) return true;
          else return false;
        };
      
        try {
          let user = await userModel.findOne({ id: req.userId });
          if (!user) {
            res.status(400).json({
              error: "Room/abort : Bad request",
            });
            return;
          }
      
          let room = await roomModel.findById(req.body.roomId);
          if (!room) {
            res.status(404).json({
              error: "Room/abort : no corresponding room",
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
            // 방의 출발시간이 지나고 정산이 되지 않으면 나갈 수 없음
            if(isOvertime(room, time) && !room.isOver){
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
          await room.execPopulate(roomPopulateQuery);
          res.send(room);
        } catch (error) {
          console.log(error);
          res.status(500).json({
            error: "Room/abort : internal server error",
          });
        }
      },
    searchHandler : async (req, res) => {
        const { from, to, time } = req.query;
        // console.log(req.query);
    
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
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
      },
    searchByNameHandler : async (req, res) => {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
          res.status(400).json({
            error: "Room/searchByName : Bad request",
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
      },
    searchByUserHandler : async (req, res) => {

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
          console.log(err);
          res.status(500).json({
            error: "Rooms/searchByUser : internal server error",
          });
        }
      },

    getAllRoomHandler : async (_, res) => {
        console.log("GET ALL ROOM");
        const result = await roomModel.find({}).populate(roomPopulateQuery).exec();
        res.json(result);
        return;
      },
    
    removeAllRoomHandler : async (_, res) => {
        console.log("DELETE ALL ROOM");
        await roomModel.remove({});
        res.redirect("/rooms/getAllRoom");
        return;
      },
    idSettlementHandler : async (req, res) => {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
          res.status(400).json({
              error: "/:id/settlement : Bad request",
          });
          return;
        }
        
    
        try {
          const user = await userModel.findOne({ id: req.userId });
          let result = await roomModel.findOneAndUpdate(
            {_id : req.params.id, "settlement.studentId": user._id },
            {"settlement.$.isSettlement": true, $inc : {settlementTotal: 1}}
          );
          if (result){
    
            let room = await roomModel.findById(req.params.id);
              if (room.settlementTotal === room.part.length){
                room.isOver = true;
                await room.save();
            }
            res.send(result);      
          } else {
            res.status(404).json({
              error: " cannot find settlement info"
            });
          }
        } catch (err) {
          console.log(err);
          res.status(500).json({
            error: "/:id/settlement : internal server error",
          });
        }
    
      },
    idEditHandler : async (req, res) => {
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
      },
    
    idDeleteHandler : async (req, res) => {
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
      },
    
}