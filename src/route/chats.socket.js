const { getLoginInfo, joinChatRoom, leaveChatRoom } = require("../auth/login");
const { roomModel, userModel, chatModel } = require("../db/mongo");
const validator = require("validator");

class IllegalArgumentsException {
  constructor() {
    this.toString = () => {
      return "not enough arguments for emitChatEvent";
    };
  }
}

// express 라우터에서 채팅 이벤트를 보낼 수 있게 함수를 분리했습니다.
const emitChatEvent = async (io, roomId, chat) => {
  // chat muse contain type, content and authorId
  try {
    if (!io || !roomId || !chat.type || !chat.content || !chat.authorId) {
      throw new IllegalArgumentsException();
    }

    const author = await userModel.findById(chat.authorId);
    if (!author) {
      throw new IllegalArgumentsException();
    }

    chat.roomId = roomId;
    chat.time = Date.now();

    const chatDocument = new chatModel(chat);
    await chatDocument.save();

    chat.authorName = author.nickname;
    if (chat.type == "in" || chat.type == "out") {
      const userIds = chat.content.split("|");
      chat.names = [];
      for (const userId of userIds) {
        const user = await userModel.findOne({ id: userId });
        chat.names.push(user.nickname);
      }
    }
    io.to(`chatRoom-${roomId}`).emit("chats-receive", { chat });
  } catch (e) {
    console.log(e);
    return;
  }
};

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
        .find({ roomId: roomId, isValid: true }, "authorId text time -_id")
        .sort({ time: -1 })
        .limit(amount);

      if (chats) {
        chats.reverse();
        // FIXME : authoName 찾기
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

      emitChatEvent(io, roomId, {
        type: "text",
        content: chatMessage.content,
        authorId: myUser._id,
      });
      io.to(socket.id).emit("chats-send", { done: true });
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
          .find({ roomId, time: { $lt: lastDate } }, "authorId text time -_id")
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

module.exports = {
  emitChatEvent,
  ioListeners,
};
