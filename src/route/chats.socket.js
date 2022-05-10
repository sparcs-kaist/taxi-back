const { getLoginInfo, joinChatRoom, leaveChatRoom } = require("../auth/login");
const { roomModel, userModel, chatModel } = require("../db/mongo");
const validator = require("validator");

const ioListeners = (io, socket) => {
  const session = socket.handshake.session;

  socket.on("chats-join", async (roomId) => {
    try {
      const myUserId = getLoginInfo({ session: session }).id || "";
      const myUser = await userModel.findOne({ id: myUserId }, "_id id");
      if (!myUser)
        return io.to(socket.id).emit("chats-join", { err: "user not exist" });

      const room = await roomModel.findById(roomId, "part");
      if (!room) {
        return io.to(socket.id).emit("chats-join", { err: "room not exist" });
      }
      // If the user didn't participate in the room
      if (!room.part.indexOf(myUser._id) === -1) {
        return io.to(socket.id).emit("chats-join", { err: "user not joined" });
      }

      // join chat room
      joinChatRoom({ session: session }, socket.id, roomId);
      socket.join(`chatRoom-${roomId}`);

      const amount = 30;
      const chats = await chatModel
        .find({ roomId }, "authorId authorName text time -_id")
        .sort({ time: -1 })
        .limit(amount);
      chats.reverse();

      if (chats) {
        io.to(socket.id).emit("chats-join", { chats: chats });
      }
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

  socket.on("chats-send", async (chatMessage) => {
    try {
      const myUserId = getLoginInfo({ session: session }).id || "";
      const myUser = await userModel.findOne({ id: myUserId }, "id nickname");
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
        authorId: myUser.id,
        authorName: myUser.nickname,
        text: chatMessage.content,
        time: Date.now(),
      });
      await chat.save();
      io.to(socket.id).emit("chats-send", { done: true });
      socket.to(`chatRoom-${roomId}`).emit("chats-receive", { chat });
    } catch (e) {
      io.to(socket.id).emit("chats-send", { err: true });
    }
  });

  socket.on("chats-load", async (lastDate, amount) => {
    try {
      const roomId = session.chatRoomId;
      // 클라이언트로부터 받은 lastDate가 유효한 날짜 문자열일 때만 쿼리를 수행
      if (lastDate && validator.isISO8601(lastDate)) {
        // 새로 불러올 메시지 수는 기본 30, 사용자가 입력한 값이 유효하면 그 값을 사용
        if (validator.isInt(String(amount), { min: 1, max: 50 })) {
          amount = Number(amount);
        } else {
          amount = 30;
        }

        const chats = await chatModel
          .find({ roomId }, "authorId authorName text time -_id", {
            time: { $lt: lastDate },
          })
          .sort({ time: -1 })
          .limit(amount);
        chats.reverse();

        return io.to(socket.id).emit("chats-load", { chats });
      } else {
        return io.to(socket.id).emit("chats-load", { err: true });
      }
    } catch (e) {
      io.to(socket.id).emit("chats-load", { err: true });
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
const emitChatEvent = async (io, roomId, chat) => {
  try {
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

    await chatDocument.save();
    io.to(`chatRoom-${roomId}`).emit("chats-receive", { chat });
  } catch (e) {
    return;
  }
};

module.exports = {
  ioListeners,
  emitChatEvent,
};
