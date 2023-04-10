const { chatModel, userModel } = require("../modules/stores/mongo");
const { chatPopulateOption } = require("../modules/populates/chats");
const awsS3 = require("../modules/stores/awsS3");

const { transformChatsForRoom, emitChatEvent } = require("./socket.chats");

const loadRecentChatHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const roomId = req.body.roomId;
    const userId = req.session?.userId;
    const user = await userModel.findOne({ id: userId });
    if (!userId) {
      return res.status(403).send("Chat/ : socket did not connected");
    }
    if (!user) {
      return res.status(500).send("Chat/ : internal server error");
    }

    const chats = await chatModel
      .find({ roomId })
      .sort({ time: -1 })
      .limit(60)
      .lean()
      .populate(chatPopulateOption);

    if (chats) {
      chats.reverse();
      io.to(`user-${userId}`).emit("chat_init", {
        chats: await transformChatsForRoom(chats),
        roomId,
      });
      res.json({ result: true });
    } else {
      res.json({ result: false });
    }
  } catch (e) {
    res.status(500).send("Chat/ : internal server error");
  }
};

const loadBeforeChatHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { roomId, lastMsgDate } = req.body;
    const userId = req.session?.userId;
    const user = await userModel.findOne({ id: userId });
    if (!userId) {
      return res
        .status(403)
        .send("Chat/load/before : socket did not connected");
    }
    if (!user) {
      return res.status(500).send("Chat/load/before : internal server error");
    }

    const chats = await chatModel
      .find({ roomId, time: { $lt: lastMsgDate } })
      .sort({ time: -1 })
      .limit(60)
      .lean()
      .populate(chatPopulateOption);

    if (chats) {
      chats.reverse();
      io.to(`user-${userId}`).emit("chat_push_front", {
        chats: await transformChatsForRoom(chats),
        roomId,
      });
      res.json({ result: true });
    } else {
      res.json({ result: false });
    }
  } catch (e) {
    res.status(500).send("Chat/load/before : internal server error");
  }
};

const loadAfterChatHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { roomId, lastMsgDate } = req.body;
    const userId = req.session?.userId;
    const user = await userModel.findOne({ id: userId });
    if (!userId) {
      return res
        .status(403)
        .send("Chat/load/before : socket did not connected");
    }
    if (!user) {
      return res.status(500).send("Chat/load/after : internal server error");
    }

    const chats = await chatModel
      .find({ roomId, time: { $gt: lastMsgDate } })
      .sort({ time: -1 })
      .limit(60)
      .lean()
      .populate(chatPopulateOption);

    if (chats) {
      chats.reverse();
      io.to(`user-${userId}`).emit("chat_push_back", {
        chats: await transformChatsForRoom(chats),
        roomId,
      });
      res.json({ result: true });
    } else {
      res.json({ result: false });
    }
  } catch (e) {
    res.status(500).send("Chat/load/after : internal server error");
  }
};

const sendChatHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { roomId, type, content } = req.body;
    const userId = req.session?.userId;
    const user = await userModel.findOne({ id: userId });
    if (!userId) {
      return res.status(403).send("Chat/send : socket did not connected");
    }
    if (!user) {
      return res.status(500).send("Chat/send : internal server error");
    }
    const result = await emitChatEvent(io, roomId, {
      type,
      content,
      authorId: userId,
    });

    res.json({ result });
  } catch (e) {
    res.status(500).send("Chat/send : internal server error");
  }
};

const uploadChatImgGetPUrlHandler = async (req, res) => {
  try {
    const type = req.body.type;
    const roomId = req.session?.chatRoomId;
    const user = await userModel.findOne({ id: req.userId });
    if (!roomId) {
      return res
        .status(403)
        .send("Chat/uploadChatImg/getPUrl : did not joined the chatting");
    }
    if (!user) {
      return res
        .status(500)
        .send("Chat/uploadChatImg/getPUrl : internal server error");
    }
    const chatDocument = new chatModel({
      roomId: roomId,
      type: "s3img",
      authorId: user._id,
      time: Date.now(),
      isValid: false,
    });
    const chat = await chatDocument.save();
    const key = `chat-img/${chat._id}`;
    awsS3.getUploadPUrlPost(key, type, (err, data) => {
      if (err) {
        return res
          .status(500)
          .send("Chat/uploadChatImg/getPUrl : internal server error");
      }
      data.fields["Content-Type"] = type;
      data.fields["key"] = key;
      res.json({
        id: chat._id,
        url: data.url,
        fields: data.fields,
      });
    });
  } catch (e) {
    res.status(500).send("Chat/uploadChatImg/getPUrl : internal server error");
  }
};

const uploadChatImgDoneHandler = async (req, res) => {
  try {
    const user = await userModel.findOne(
      { id: req.userId },
      "_id nickname profileImageUrl"
    );
    const chat = await chatModel.findById(req.body.id).lean();
    if (!user) {
      return res
        .status(500)
        .send("Chat/uploadChatImg/getPUrl : internal server error");
    }
    if (!chat) {
      return res.status(404).json({
        error: "Chat/uploadChatImg/done : no corresponding chat",
      });
    }
    if (
      chat.type != "s3img" ||
      chat.isValid != false ||
      chat.authorId.toString() != user._id.toString()
    ) {
      return res.status(404).json({
        error: "Chat/uploadChatImg/done : no corresponding chat",
      });
    }
    const key = `chat-img/${chat._id}`;
    awsS3.foundObject(key, async (err, data) => {
      if (err) {
        return res
          .status(500)
          .send("Chat/uploadChatImg/getPUrl : internal server error");
      }

      chat.content = chat._id;
      emitChatEvent(req.app.get("io"), chat.roomId, chat);

      res.json({
        result: true,
      });
    });
  } catch (e) {
    res.status(500).send("Chat/uploadChatImg/done : internal server error");
  }
};

module.exports = {
  loadRecentChatHandler,
  loadBeforeChatHandler,
  loadAfterChatHandler,
  sendChatHandler,
  uploadChatImgGetPUrlHandler,
  uploadChatImgDoneHandler,
};
