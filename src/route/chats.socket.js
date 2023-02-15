const { getLoginInfo, joinChatRoom, leaveChatRoom } = require("../auth/login");
const { roomModel, userModel, chatModel } = require("../db/mongo");
const { getS3Url } = require("../db/awsS3");
const validator = require("validator");
const { getTokensOfUsers, sendMessageByTokens } = require("../modules/fcm");
const logger = require("../modules/logger");

/** @constant {{path: string, select: string}[]}
 * 쿼리를 통해 얻은 Chat Document를 populate할 설정값을 정의합니다.
 */
const chatPopulateOption = [
  { path: "authorId", select: "_id nickname profileImageUrl" },
];

/**
 * emitChatEvent의 필수 파라미터가 주어지지 않은 경우 발생하는 예외를 정의하는 클래스입니다.
 */
class IllegalArgumentsException {
  constructor() {
    this.toString = () => {
      return "not enough arguments for emitChatEvent";
    };
  }
}

/**
 * 채팅 타입과 작성자의 닉네임, 본문을 받아 채팅 타입에 따라 다르게 FCM 알림으로 보낼 content를 생성합니다.
 * @summary emitChatEvent에서만 사용됩니다.
 * @param {string} type - 채팅 메시지의 유형입니다. "text" | "s3img" | "in" | "out" 입니다.
 * @param {string} nickname - 작성자의 닉네임입니다.
 * @param {string} content - 메시지 본문입니다.
 * @return {string} FCM 알림으로 보낼 content입니다.
 */
const getNotificationContent = (type, nickname, content) => {
  if (type === "text") {
    return `${nickname}: ${content}`;
  } else if (type === "s3img") {
    return `${nickname}: Image`;
  } else {
    // type이 "in"이거나 "out"인 경우
    return `${nickname}: ${type}`;
  }
};

/**
 * 채팅을 전송하고 채팅 알림을 발생시킵니다.
 * @summary express 라우터에서 채팅 이벤트를 보낼 수 있게 함수를 분리했습니다.
 * @param {Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} io - Socket.io 서버 인스턴스입니다. req.app.get("io")를 통해 접근할 수 있습니다.
 * @param {string} roomId - 채팅 및 채팅 알림을 보낼 방의 ObjectId입니다.
 * @param {Object} chat - 채팅 메시지 내용입니다.
 * @param {string} chat.type - 채팅 메시지의 유형입니다. "text" | "s3img" | "in" | "out" 입니다.
 * @param {string} chat.content - 채팅 메시지의 본문입니다. chat.type이 "s3img"인 경우에는 채팅의 objectId입니다. chat.type이 "in"이거나 "out"인 경우 입퇴장한 사용자의 id(!==ObjectId)입니다.
 * @param {string} chat.authorId - 채팅을 보낸 사용자의 ObjectId입니다.
 * @param {Date?} chat.time - optional. 채팅 메시지 전송 시각입니다.
 * @return {Promise<Boolean>} 채팅 및 알림 전송에 성공하면 true, 중간에 오류가 발생하면 false를 반환합니다.
 */
const emitChatEvent = async (io, roomId, chat) => {
  try {
    // chat must contain type, content and authorId
    // chat can contain time or not.
    if (!io || !roomId || !chat?.type || !chat?.content || !chat?.authorId) {
      throw new IllegalArgumentsException();
    }

    const { type, content, authorId } = chat;
    const time = chat?.time || Date.now();
    const author = await userModel.findById(
      authorId,
      "_id nickname profileImageUrl"
    );
    if (!author) {
      throw new IllegalArgumentsException();
    }

    const chatDocument = await chatModel.findOneAndUpdate(
      {
        type,
        authorId,
        roomId,
        time,
      },
      {
        type,
        authorId,
        roomId,
        time,
        content,
        isValid: true,
      },
      { upsert: true, new: true }
    );

    logger.info(chatDocument);

    // 방의 모든 사용자에게 이미지 수신 이벤트를 발생시킵니다.
    io.to(`chatRoom-${roomId}`).emit("chats-receive", { chatDocument });

    // 해당 방에 참여중인 사용자들에게 알림을 전송합니다.
    const room = await roomModel.findById(roomId, "name part");
    const urlOnClick = `/myroom/${roomId}`;
    const userIdsExceptAuthor = room.part
      .map((participant) => participant.user)
      .filter((userId) => userId !== authorId);
    const deviceTokens = await getTokensOfUsers(userIdsExceptAuthor);

    await sendMessageByTokens(
      deviceTokens,
      type,
      room.name,
      getNotificationContent(type, author.nickname, content),
      getS3Url(`/profile-img/${author.profileImageUrl}`),
      urlOnClick
    );
    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
};

/**
 * Chat Object의 array가 주어졌을 때 클라이언트에서 처리하기 편한 형태로 Chat Object를 가공합니다.
 * @param {[Object]} chats - Chats Document에 lean과 populate(chatPopulateOption)을 차례로 적용한 Chat Object의 배열입니다.
 * @return {Promise<Array>} {type: String, authorId: String, authorName: String, authorProfileUrl: String, content: string, time: Date}로 이루어진 chat 객체의 배열입니다.
 */
const transformChatsForRoom = async (chats) => {
  const chatsToSend = [];

  for (const chat of chats) {
    // inOutNames 배열(들어오거나 나간 사용자들의 닉네임으로 이루어진 배열)을 생성합니다.
    chat.inOutNames = [];
    if (chat.type === "in" || chat.type === "out") {
      const inOutUserIds = chat.content.split("|");
      chat.inOutNames = await Promise.all(
        inOutUserIds.map(async (userId) => {
          const user = await userModel.findOne({ id: userId }, "nickname");
          return user.nickname;
        })
      );
    }
    chatsToSend.push({
      type: chat.type,
      authorId: chat.authorId._id,
      authorName: chat.authorId.nickname,
      authorProfileUrl: chat.authorId.profileImageUrl,
      content: chat.content,
      time: chat.time,
      isValid: chat.isValid,
      inOutNames: chat.inOutNames,
    });
  }
  return chatsToSend;
};

const ioListeners = (io, socket) => {
  const session = socket.handshake.session;

  // 사용자가 Socket.io 서버와 연결될 때마다 발생하는 이벤트
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
      session.save(); // Socket.io 세션의 변경 사항을 Express 세션에 반영.

      const amount = 30;
      const chats = await chatModel
        .find({ roomId: roomId, isValid: true })
        .sort({ time: -1 })
        .limit(amount)
        .lean()
        .populate(chatPopulateOption);

      if (chats) {
        chats.reverse();
        io.to(socket.id).emit("chats-join", {
          chats: await transformChatsForRoom(chats),
        });
      }
    } catch (err) {
      logger.error(err);
      io.to(socket.id).emit("chats-join", { err: true });
    }
  });

  // 사용자와 Socket.io 서버의 연결이 끊어졌을 때 발생하는 이벤트
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
    } catch (err) {
      logger.error(err);
      io.to(socket.id).emit("chats-disconnect", { err: true });
    }
  });

  // 사용자가 채팅 메시지를 전송했을 때 발생하는 이벤트
  socket.on("chats-send", async (chatMessage) => {
    try {
      const myUserId = getLoginInfo({ session: session }).id || "";
      const myUser = await userModel.findOne(
        { id: myUserId },
        "_id id nickname profileImageUrl"
      );
      if (!myUser)
        return io.to(socket.id).emit("chats-send", { err: "user not exist" });
      const roomId = session.chatRoomId;
      if (!roomId)
        return io
          .to(socket.id)
          .emit("chats-send", { err: "user not join chat room" });
      await emitChatEvent(io, roomId, {
        type: "text",
        content: chatMessage.content,
        authorId: myUser._id,
      });
      io.to(socket.id).emit("chats-send", { done: true });
    } catch (err) {
      logger.error(err);
      io.to(socket.id).emit("chats-send", { err: true });
    }
  });

  // 사용자가 과거 채팅 메시지를 로드하려 할 때 발생하는 이벤트
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
          .find({ roomId, time: { $lt: lastDate } })
          .sort({ time: -1 })
          .limit(amount)
          .lean()
          .populate(chatPopulateOption);

        if (chats) {
          chats.reverse();
          io.to(socket.id).emit("chats-load", {
            chats: await transformChatsForRoom(chats),
          });
        }
      } else {
        return io.to(socket.id).emit("chats-load", { err: true });
      }
    } catch (err) {
      logger.error(err);
      io.to(socket.id).emit("chats-load", { err: true });
    }
  });
};

module.exports = {
  emitChatEvent,
  ioListeners,
};
