const express = require("express");
const mongo = require("../db/mongo");
const chunkArray = require("../modules/chunkArray");

const router = express.Router();

const validateRoomId = (roomId) => {
  if (isNaN(roomId)) {
    return false;
  }
  const id = Number(roomId);
  if (!Number.isInteger(id)) {
    return false;
  }
  if (id <= 0) return false;
  return true;
}

router.get('/:roomId', async (req, res) => {
  try {
    if (!validateRoomId(req.params.roomId)) {
      return res.status(400).send("wrong room id");
    }
    const room = await mongo.chatRoomModel.findOne({ "_id": req.params.roomId });
    const chats = room?.chats;
    if (!room) {
      return res.status(404).send("ID not exist");
    }
    // if (room.isSecret && !authenticate(req.query.token)) res.status(401).send("Invalid token");
    if (!chats || chats.length === 0) return res.send({
      data: [],
      page: 0,
      totalPage: 0,
      totalChats: 0
    });

    const chunkedArray = chunkArray(chats, req.query.pageSize);
    if (chunkedArray.length <= req.query.page) {
      return res.status(400).send("Invalid page")
    }
    res.send({
      data: chunkedArray[Number(req.query.page)],
      page: req.query.page,
      totalPage: chunkedArray.length - 1,
      totalChats: chats.length,
    });
  } catch (e) {
    console.error(e);
  }
})

module.exports = router;