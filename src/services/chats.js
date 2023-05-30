const { chatModel, userModel, roomModel } = require("../modules/stores/mongo");
const { chatPopulateOption } = require("../modules/populates/chats");
const awsS3 = require("../modules/stores/awsS3");
const {
  transformChatsForRoom,
  emitChatEvent,
  emitUpdateEvent,
} = require("../modules/socket");
const {
  roomPopulateOption,
  formatSettlement,
} = require("../modules/populates/rooms");

const chatCount = 60;

const loadRecentChatHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { userId } = req;
    const { roomId } = req.body;
    const { id: sessionId } = req.session;
    if (!userId) {
      return res.status(500).send("Chat/ : internal server error");
    }
    if (!io) {
      return res.status(403).send("Chat/ : socket did not connected");
    }

    const isPart = await isUserInRoom(userId, roomId);
    if (!isPart) {
      return res
        .status(403)
        .send("Chat/ : user did not participated in the room");
    }

    const chats = await chatModel
      .find({ roomId, isValid: true })
      .sort({ time: -1 })
      .limit(chatCount)
      .lean()
      .populate(chatPopulateOption);

    if (chats) {
      chats.reverse();
      io.in(`session-${sessionId}`).emit("chat_init", {
        chats: await transformChatsForRoom(chats),
      });
      res.json({ result: true });
    } else {
      res.status(500).send("Chat/ : internal server error");
    }
  } catch (e) {
    res.status(500).send("Chat/ : internal server error");
  }
};

const loadBeforeChatHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { userId } = req;
    const { roomId, lastMsgDate } = req.body;
    const { id: sessionId } = req.session;
    if (!userId) {
      return res.status(500).send("Chat/load/before : internal server error");
    }
    if (!io) {
      return res
        .status(403)
        .send("Chat/load/before : socket did not connected");
    }

    const isPart = await isUserInRoom(userId, roomId);
    if (!isPart) {
      return res
        .status(403)
        .send("Chat/load/before : user did not participated in the room");
    }

    const chats = await chatModel
      .find({ roomId, time: { $lt: lastMsgDate }, isValid: true })
      .sort({ time: -1 })
      .limit(chatCount)
      .lean()
      .populate(chatPopulateOption);

    if (chats) {
      chats.reverse();
      io.in(`session-${sessionId}`).emit("chat_push_front", {
        chats: await transformChatsForRoom(chats),
      });
      res.json({ result: true });
    } else {
      res.status(500).send("Chat/load/before : internal server error");
    }
  } catch (e) {
    res.status(500).send("Chat/load/before : internal server error");
  }
};

const loadAfterChatHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { userId } = req;
    const { roomId, lastMsgDate } = req.body;
    const { id: sessionId } = req.session;
    if (!userId) {
      return res.status(500).send("Chat/load/after : internal server error");
    }
    if (!io) {
      return res.status(403).send("Chat/load/after : socket did not connected");
    }

    const isPart = await isUserInRoom(userId, roomId);
    if (!isPart) {
      return res
        .status(403)
        .send("Chat/load/after : user did not participated in the room");
    }

    const chats = await chatModel
      .find({ roomId, time: { $gt: lastMsgDate }, isValid: true })
      .sort({ time: 1 })
      .limit(chatCount)
      .lean()
      .populate(chatPopulateOption);

    if (chats) {
      io.in(`session-${sessionId}`).emit("chat_push_back", {
        chats: await transformChatsForRoom(chats),
      });
      res.json({ result: true });
    } else {
      res.status(500).send("Chat/load/after : internal server error");
    }
  } catch (e) {
    res.status(500).send("Chat/load/after : internal server error");
  }
};

const sendChatHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { userId } = req;
    const { roomId, type, content } = req.body;
    const user = await userModel.findOne({ id: userId });

    if (!userId || !user) {
      return res.status(500).send("Chat/send : internal server error");
    }
    if (!io) {
      return res.status(403).send("Chat/send : socket did not connected");
    }

    const isPart = await isUserInRoom(userId, roomId);
    if (!isPart) {
      return res
        .status(403)
        .send("Chat/send : user did not participated in the room");
    }

    if (
      await emitChatEvent(io, {
        roomId,
        type,
        content,
        authorId: user._id,
      })
    )
      res.json({ result: true });
    else res.status(500).send("Chat/send : internal server error");
  } catch (e) {
    res.status(500).send("Chat/send : internal server error");
  }
};

const updateChatHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { userId } = req;
    const { roomId, lastMsgDate } = req.body;
    const user = await userModel.findOne({ id: userId });

    if (!userId || !user) {
      return res.status(500).send("Chat/update : internal server error");
    }
    if (!io) {
      return res.status(403).send("Chat/update : socket did not connected");
    }
    const isPart = await isUserInRoom(userId, roomId);
    if (!isPart) {
      return res
        .status(403)
        .send("Chat/update : user did not participated in the room");
    }

    const roomObject = await roomModel
      .findOneAndUpdate(
        {
          _id: roomId,
          part: {
            $elemMatch: {
              user: user._id,
            },
          },
        },
        {
          $set: { "part.$[updater].readAt": lastMsgDate },
        },
        {
          new: true,
          arrayFilters: [{ "updater.user": { $eq: user._id } }],
        }
      )
      .lean()
      .populate(roomPopulateOption);
    if (!roomObject) {
      return res.status(404).send("Chat/update : cannot find room info");
    }

    /* TODO: Return Formatting */
    if (await emitUpdateEvent(io)) res.json({ part: roomObject.part });
    else res.status(500).send("Chat/update : internal server error");
  } catch (e) {
    res.status(500).send("Chat/update : internal server error");
  }
};

const uploadChatImgGetPUrlHandler = async (req, res) => {
  try {
    const { type, roomId } = req.body;
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
      emitChatEvent(req.app.get("io"), chat);

      res.json({
        result: true,
      });
    });
  } catch (e) {
    res.status(500).send("Chat/uploadChatImg/done : internal server error");
  }
};

/**
 * 주어진 유저가 주어진 방에 참여하는 중인지 확인합니다.
 * @summary 채팅 load/send 관련 api에서 검증을 위하여 함수로 분리하였습니다.
 * @param {string} userId - 확인하고픈 user의 Id 입니다.
 * @param {string} roomId - 참여하는지 확인하고픈 방의 objectId 입니다.
 * @return {Promise<Boolean>} userId가 방에 포함되어 있다면 true, 그 외의 경우 false를 반환합니다.
 */
const isUserInRoom = async (userId, roomId) => {
  const user = await userModel.findOne({ id: userId });
  const { part } = await roomModel.findById(roomId);

  if (!part || !user) return false;
  return part
    .map((participant) => participant.user)
    .some((user) => user.equals(user._id));
};

module.exports = {
  loadRecentChatHandler,
  loadBeforeChatHandler,
  loadAfterChatHandler,
  sendChatHandler,
  uploadChatImgGetPUrlHandler,
  uploadChatImgDoneHandler,
  updateChatHandler,
};
