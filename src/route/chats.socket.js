const { getLoginInfo, joinChatRoom, leaveChatRoom } = require("../auth/login");
const { roomModel, userModel, chatModel } = require("../db/mongo");

const ioListeners = (io, socket) => {
  const session = socket.handshake.session;

  socket.on("chats-join", async (roomId) => {
    try {
      const myUserId = getLoginInfo({ session: session }).id || "";
      const myUser = await userModel.findOne({ id: myUserId }, "_id id");
      if (!myUser)
        return io.to(socket.id).emit("chats-join", { err: "user not exist" });

      roomModel.findOne({ _id: roomId }, "part", (err, room) => {
        if (err)
          return io.to(socket.id).emit("chats-join", { err: "mongo error" });
        if (!room)
          return io.to(socket.id).emit("chats-join", { err: "room not exist" });

        // if user don't participate in the room
        if (room.part.indexOf(myUser._id) < 0) {
          return io.to(socket.id).emit("chats-join", { err: "user not join" });
        }

        // join chat room
        joinChatRoom({ session: session }, roomId);
        socket.join(`chatRoom-${roomId}`);

        // find chats
        chatModel
          .find({ roomId: roomId }, (err, chats) => {
            if (err) return res.status(404).send(err);
            io.to(socket.id).emit("chats-join", { chats: chats });
          })
          .sort({ time: 1 });
      });
    } catch (e) {
      io.to(socket.id).emit("chats-join", { err: true });
    }
  });

  socket.on("chats-disconnect", async () => {
    try {
      const myUserId = getLoginInfo({ session: session }).id || "";
      const myUser = await userModel.findOne({ id: myUserId }, "_id nickname");
      if (!myUser)
        return io
          .to(socket.id)
          .emit("chats-disconnect", { err: "user not exist" });

      const roomId = session.chatRoomId;
      if (!roomId)
        return io
          .to(socket.id)
          .emit("chats-disconnect", { err: "user not join chat room" });

      // leave chat room
      leaveChatRoom({ session: session });
      socket.leave(`chatRoom-${roomId}`);
    } catch (e) {
      io.to(socket.id).emit("chats-disconnect", { err: true });
    }
  });

  socket.on("chats-send", async (content) => {
    try {
      const myUserId = getLoginInfo({ session: session }).id || "";
      const myUser = await userModel.findOne({ id: myUserId }, "_id nickname");
      if (!myUser)
        return io.to(socket.id).emit("chats-send", { err: "user not exist" });

      const roomId = session.chatRoomId;
      if (!roomId)
        return io
          .to(socket.id)
          .emit("chats-send", { err: "user not join chat room" });

      // push chat to db
      const chat = new chatModel({
        roomId: roomId,
        authorId: myUser._id,
        authorName: myUser.nickname,
        text: content,
        time: Date.now(),
      });
      chat.save((err) => {
        if (err) io.to(socket.id).emit("chats-send", { err: "mongo error" });
        else {
          io.to(socket.id).emit("chats-send", { done: true });
          io.to(`chatRoom-${roomId}`).emit("chats-receive", chat);
        }
      });
    } catch (e) {
      io.to(socket.id).emit("chats-send", { err: true });
    }
  });
};

class IllegalArgumentsException {
  constructor() {
    this.toString = () => {
      return "not enough arguments for emitChatEvent";
    };
  }
}

// express 라우터에서 채팅 이벤트를 보낼 수 있게 함수를 분리했습니다.
const emitChatEvent = (io, roomId, chat) => {
  if (!io || !roomId || !chat.text) {
    throw new IllegalArgumentsException();
  }
  if (!chat.authorId || !chat.authorName) {
    chat.authorId = null;
    chat.authorName = null;
  }
  if (!chat.time) {
    chat.time = Date.now();
  }
  if (!chat.roomId) {
    chat.roomId = roomId;
  }

  const chatDocument = new chatModel(chat);
  chatDocument.save((err) => {
    if (!err) {
      io.to(`chatRoom-${roomId}`).emit("chats-receive", chat);
    }
  });
};

module.exports = {
  ioListeners,
  emitChatEvent,
};
