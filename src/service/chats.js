const { roomModel, userModel } = require("../db/mongo");
const { getLoginInfo } = require("../auth/login");

const chatHandler = async (req, res) => {
  const roomId = req.params.roomId || "";

  roomModel.findOne({ _id: roomId }, "name part time", async (err, room) => {
    if (err) return res.status(404).send(err);
    if (!room) return res.status(404).send("roomId not exist");

    // user's objectId -> nickname, id
    const parts = [];
    const myUserId = getLoginInfo(req).id || "";
    let includingMe = false;
    for (const i of room.part) {
      const user = await userModel.findOne({ _id: i }, "_id name nickname id");
      if (user) {
        parts.push(user);
        if (myUserId == user.id) includingMe = true;
      }
    }

    // if user don't participate in the room
    if (!includingMe) return res.status(404).send("no authority");

    res.send({
      name: room.name,
      time: room.time,
      parts: parts,
    });
  });
};

module.exports = {
  chatHandler,
};
