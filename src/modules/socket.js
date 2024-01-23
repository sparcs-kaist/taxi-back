const { Server } = require("socket.io");

const sessionMiddleware = require("@/middlewares/session");
const logger = require("./logger");
const { getLoginInfo } = require("./auths/login");
const { roomModel, userModel, chatModel } = require("./stores/mongo");
const { getS3Url } = require("./stores/aws");
const { getTokensOfUsers, sendMessageByTokens } = require("./fcm");

const { corsWhiteList } = require("@/loadenv");
const { chatPopulateOption } = require("./populates/chats");

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
      roomId: chat.roomId,
      type: chat.type,
      authorId: chat.authorId?._id,
      authorName: chat.authorId?.nickname,
      authorProfileUrl: chat.authorId?.profileImageUrl,
      content: chat.content,
      time: chat.time,
      isValid: chat.isValid,
      inOutNames: chat.inOutNames,
    });
  }

  return chatsToSend;
};

/**
 * FCM 알림으로 보내는 content는 채팅 type에 따라 달라집니다.
 * 예를 들어, type이 "text"인 경우 `${nickname}: ${content}`를 보냅니다.
 */
const getMessageBody = (type, nickname = "", content = "") => {
  // 닉네임이 9글자를 넘어가면 "..."으로 표시합니다.
  const ellipsisedNickname =
    nickname.length > 9 ? nickname.slice(0, 7) + "..." : nickname;

  // TODO: 채팅 메시지 유형에 따라 Body를 다르게 표시합니다.
  // TODO: 사용자 언어를 가져올 수 있으면 개선할 수 있다고 생각합니다.
  switch (type) {
    case "text":
      return `${ellipsisedNickname}: ${content}`;
    case "s3img": {
      const suffix = "님이 이미지를 전송하였습니다";
      return `${ellipsisedNickname} ${suffix}`;
    }
    case "in": {
      const suffix = "님이 입장하였습니다";
      return `${ellipsisedNickname} ${suffix}`;
    }
    case "out": {
      const suffix = "님이 퇴장하였습니다";
      return `${ellipsisedNickname} ${suffix}`;
    }
    case "payment": {
      const suffix = "님이 정산을 시작하였습니다";
      return `${ellipsisedNickname} ${suffix}`;
    }
    case "settlement": {
      const suffix = "님이 송금을 완료하였습니다";
      return `${ellipsisedNickname} ${suffix}`;
    }
    case type === "account": {
      const suffix = "님이 계좌번호를 전송하였습니다";
      return `${ellipsisedNickname} ${suffix}`;
    }
    case "departure":
      return `택시 출발 ${content}분 전 입니다`;
    case "arrival":
      return "아직 정산 시작을 하지 않았거나 송금을 완료하지 않은 사용자가 있습니다";
    default:
      // 정의되지 않은 type의 경우에는 nickname만 반환합니다.
      return ellipsisedNickname;
  }
};

/**
 * 채팅을 전송하고 채팅 알림을 발생시킵니다.
 * @summary express 라우터에서 채팅 이벤트를 보낼 수 있게 함수를 분리했습니다.
 * @param {Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} io - Socket.io 서버 인스턴스입니다. req.app.get("io")를 통해 접근할 수 있습니다.
 * @param {Object} chat - 채팅 메시지 내용입니다.
 * @param {string} chat.roomId - 채팅 및 채팅 알림을 보낼 방의 ObjectId입니다.
 * @param {string} chat.type - 채팅 메시지의 유형입니다. "text" | "s3img" | "in" | "out" | "payment" | "settlement" | "account" | "departure" | "arrival" 입니다.
 * @param {string} chat.content - 채팅 메시지의 본문입니다. chat.type이 "s3img"인 경우에는 채팅의 objectId입니다. chat.type이 "in"이거나 "out"인 경우 입퇴장한 사용자의 id(!==ObjectId)입니다.
 * @param {string} chat.authorId - optional. 채팅을 보낸 사용자의 ObjectId입니다.
 * @param {Date?} chat.time - optional. 채팅 메시지 전송 시각입니다.
 * @return {Promise<Boolean>} 채팅 및 알림 전송에 성공하면 true, 중간에 오류가 발생하면 false를 반환합니다.
 */
const emitChatEvent = async (io, chat) => {
  try {
    const { roomId, type, content, authorId } = chat;

    // chat must contains roomId, type, and content
    if (!io || !roomId || !type || !content) {
      throw new IllegalArgumentsException();
    }

    // chat optionally contains time
    const time = chat?.time || Date.now();

    // roomId must be valid
    const { name, part } = await roomModel.findById(roomId, "name part");
    if (!name || !part) {
      throw new IllegalArgumentsException();
    }

    // chat optionally contains authorId
    const { nickname, profileImageUrl } = authorId
      ? await userModel.findById(authorId, "nickname profileImageUrl")
      : {};
    if (authorId && (!nickname || !profileImageUrl)) {
      throw new IllegalArgumentsException();
    }

    const chatDocument = await chatModel
      .findOneAndUpdate(
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
      )
      .lean()
      .populate(chatPopulateOption);

    chatDocument.authorName = nickname;
    chatDocument.authorProfileUrl = profileImageUrl;

    const userIds = part.map((participant) => participant.user);
    const userIdsExceptAuthor = authorId
      ? part
          .map((participant) => participant.user)
          .filter((userId) => userId.toString() !== authorId.toString())
      : userIds;

    // 방의 모든 사용자에게 socket 메세지 수신 이벤트를 발생시킵니다.
    const chatsForRoom = await transformChatsForRoom([chatDocument]);
    await Promise.all(
      userIds.map(async (userId) =>
        io.in(`user-${userId}`).emit("chat_push_back", {
          chats: chatsForRoom,
          roomId,
        })
      )
    );

    // 방의 작성자를 제외한 참여중인 사용자들에게 푸시 알림을 전송합니다.
    const deviceTokensExceptAuthor = await getTokensOfUsers(
      userIdsExceptAuthor,
      { chatting: true }
    );
    await sendMessageByTokens(
      deviceTokensExceptAuthor,
      type,
      name,
      getMessageBody(type, nickname, content),
      getS3Url(`/profile-img/${profileImageUrl}`),
      `/myroom/${roomId}`
    );

    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
};

const emitUpdateEvent = async (io, roomId) => {
  try {
    // 방의 모든 사용자에게 socket 메세지 업데이트 이벤트를 발생시킵니다.
    if (!io || !roomId) {
      throw new IllegalArgumentsException();
    }

    const { name, part } = await roomModel.findById(roomId, "name part");

    if (!name || !part) {
      throw new IllegalArgumentsException();
    }

    part.forEach(({ user }) =>
      io.in(`user-${user}`).emit("chat_update", {
        roomId,
      })
    );

    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
};

// https://socket.io/how-to/use-with-express-session 참고
const startSocketServer = (server) => {
  const io = new Server(server, {
    allowRequest: (req, callback) => {
      const fakeRes = {
        getHeader() {
          return [];
        },
        setHeader(key, values) {
          req.cookieHolder = values[0];
        },
        writeHead() {},
      };
      sessionMiddleware(req, fakeRes, () => {
        if (req.session) {
          fakeRes.writeHead();
          req.session.save();
        }
        callback(null, true);
      });
    },
    cors: {
      origin: corsWhiteList,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.engine.on("initial_headers", (headers, req) => {
    if (req.cookieHolder) {
      headers["set-cookie"] = req.cookieHolder;
      delete req.cookieHolder;
    }
  });

  io.on("connection", (socket) => {
    try {
      const req = socket.request;
      req.session.reload((err) => {
        if (err) throw err;

        const { oid: userOid } = getLoginInfo(req);
        if (!userOid) return;

        socket.join(`session-${req.session.id}`);
        socket.join(`user-${userOid}`);
      });

      socket.on("disconnect", () => {});
    } catch (err) {
      logger.error(err);
    }
  });

  return io;
};

module.exports = {
  transformChatsForRoom,
  emitChatEvent,
  emitUpdateEvent,
  startSocketServer,
};
