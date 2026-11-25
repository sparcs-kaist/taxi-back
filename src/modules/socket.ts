import type { Request } from "express";
import type { Server as HttpServer } from "http";
import { Types } from "mongoose";
import { Server } from "socket.io";

import { sessionMiddleware } from "@/middlewares";
import { buddySocketMiddleware } from "@/middlewares/buddyToken";
import logger from "@/modules/logger";
import { getLoginInfo, getBearerToken } from "@/modules/auths/login";
import { resolveS3Url } from "@/modules/stores/aws";
import { roomModel, userModel, chatModel } from "@/modules/stores/mongo";
import { getTokensOfUsers, sendMessageByTokens } from "@/modules/fcm";
import { corsWhiteList } from "@/loadenv";
import {
  chatPopulateOption,
  type ChatPopulatePath,
  type PopulatedChat,
} from "@/modules/populates/chats";
import type { ChatType } from "@/types/mongo";
import { parseSettlementMeta, type SettlementMeta } from "./settlement";

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

interface TransformedChat {
  roomId: string;
  type: ChatType;
  authorId?: string;
  authorName?: string;
  authorProfileUrl?: string;
  authorIsWithdrew?: boolean;
  authorResidence?: string;
  content: string;
  time: Date;
  isValid: boolean;
  inOutNames?: string[];
  settlementMeta?: SettlementMeta;
}

/**
 * Chat Object의 array가 주어졌을 때 클라이언트에서 처리하기 편한 형태로 Chat Object를 가공합니다.
 * @param chats - Chats Document에 lean과 populate(chatPopulateOption)을 차례로 적용한 Chat Object의 배열입니다.
 */
export const transformChatsForRoom = async (chats: PopulatedChat[]) => {
  return await Promise.all(
    chats.map(async (chat) => {
      // inOutNames 배열(들어오거나 나간 사용자들의 닉네임으로 이루어진 배열)을 생성합니다.
      let inOutNames;
      if (chat.type === "in" || chat.type === "out") {
        const inOutUserOids = chat.content.split("|");
        inOutNames = await Promise.all(
          inOutUserOids.map(async (userOid) => {
            const user = await userModel.findById(userOid, "nickname");
            return user!.nickname;
          })
        );
      }

      const settlementMeta: SettlementMeta | undefined =
        chat.type === "settlement"
          ? parseSettlementMeta(chat.content)
          : undefined;

      return {
        roomId: chat.roomId.toString(),
        type: chat.type!,
        authorId: chat.authorId?._id?.toString(),
        authorName: chat.authorId?.nickname,
        authorProfileUrl: resolveS3Url(chat.authorId?.profileImageUrl),
        authorIsWithdrew: chat.authorId?.withdraw,
        authorResidence: chat.authorId?.residence,
        content: chat.content,
        time: chat.time,
        isValid: chat.isValid,
        inOutNames,
        ...(settlementMeta ? { settlementMeta } : {}),
      } satisfies TransformedChat;
    })
  );
};

/**
 * FCM 알림으로 보내는 content는 채팅 type에 따라 달라집니다.
 * 예를 들어, type이 "text"인 경우 `${nickname}: ${content}`를 보냅니다.
 */
const getMessageBody = (type: ChatType, nickname = "", content = "") => {
  // 닉네임이 9글자를 넘어가면 "..."으로 표시합니다.
  const ellipsisedNickname =
    nickname.length > 9 ? nickname.slice(0, 7) + "..." : nickname;

  const localizedBody = (body: string, key: string, args: string[] = []) => ({
    body,
    localization: { key, args },
  });

  switch (type) {
    case "text":
      return { body: `${ellipsisedNickname}: ${content}` };
    case "s3img":
      return localizedBody(
        `${ellipsisedNickname} 님이 이미지를 전송하였습니다`,
        "TAXI_CHAT_IMAGE"
      );
    case "in":
      return localizedBody(`${ellipsisedNickname} 님이 입장하였습니다`, "TAXI_IN", [
        ellipsisedNickname,
      ]);
    case "out":
      return localizedBody(`${ellipsisedNickname} 님이 퇴장하였습니다`, "TAXI_OUT", [
        ellipsisedNickname,
      ]);
    case "settlement":
      return localizedBody(
        `${ellipsisedNickname} 님이 정산을 시작하였습니다`,
        "TAXI_SETTLEMENT",
        [ellipsisedNickname]
      );
    case "payment":
      return localizedBody(
        `${ellipsisedNickname} 님이 송금을 완료하였습니다`,
        "TAXI_PAYMENT",
        [ellipsisedNickname]
      );
    case "account":
      return localizedBody(
        `${ellipsisedNickname} 님이 계좌번호를 전송하였습니다`,
        "TAXI_CHAT_ACCOUNT"
      );
    case "departure":
      return localizedBody(`택시 출발 ${content}분 전 입니다`, "TAXI_DEPARTURE", [
        content,
      ]);
    case "arrival":
      return localizedBody(
        "아직 정산 시작을 하지 않았거나 송금을 완료하지 않은 사용자가 있습니다",
        "TAXI_ARRIVAL"
      );
    default:
      return { body: ellipsisedNickname };
  }
};

/**
 * 채팅을 전송하고 채팅 알림을 발생시킵니다.
 * @summary express 라우터에서 채팅 이벤트를 보낼 수 있게 함수를 분리했습니다.
 * @param io - Socket.io 서버 인스턴스입니다. req.app.get("io")를 통해 접근할 수 있습니다.
 * @param chat - 채팅 메시지 내용입니다.
 * @param chat.roomId - 채팅 및 채팅 알림을 보낼 방의 ObjectId입니다.
 * @param chat.type - 채팅 메시지의 유형입니다. "text" | "s3img" | "in" | "out" | "payment" | "settlement" | "account" | "departure" | "arrival" 입니다.
 * @param chat.content - 채팅 메시지의 본문입니다. chat.type이 "s3img"인 경우에는 채팅의 objectId입니다. chat.type이 "in"이거나 "out"인 경우 입퇴장한 사용자의 oid입니다.
 * @param chat.authorId - optional. 채팅을 보낸 사용자의 ObjectId입니다.
 * @param chat.time - optional. 채팅 메시지 전송 시각입니다.
 * @return 채팅 및 알림 전송에 성공하면 true, 중간에 오류가 발생하면 false를 반환합니다.
 */
export const emitChatEvent = async (
  io: Server,
  chat: {
    roomId: Types.ObjectId | string;
    type?: ChatType;
    content: string;
    authorId?: Types.ObjectId | string;
    time?: Date;
  }
) => {
  try {
    const { roomId, type, content, authorId } = chat;

    // chat must contains roomId, type, and content
    if (!io || !type || !content) {
      throw new IllegalArgumentsException();
    }

    // chat optionally contains time
    const time = chat?.time || Date.now();

    // roomId must be valid
    const room = await roomModel.findById(roomId, "name part");
    if (!room) {
      throw new IllegalArgumentsException();
    }
    const { name, part } = room;

    // chat optionally contains authorId
    const { nickname, profileImageUrl } =
      (authorId &&
        (await userModel.findById(authorId, "nickname profileImageUrl"))) ||
      {};
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
      .populate<ChatPopulatePath>(chatPopulateOption);

    const userIds = part.map((participant) => participant.user.toString());
    const userIdsExceptAuthor = authorId
      ? userIds.filter((userId) => userId !== authorId.toString())
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
    const { body, localization } = getMessageBody(type, nickname, content);
    await sendMessageByTokens(
      deviceTokensExceptAuthor,
      type,
      name,
      body,
      resolveS3Url(profileImageUrl),
      `/myroom/${roomId}`,
      localization
    );

    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
};

export const emitUpdateEvent = async (io: Server, roomId: string) => {
  try {
    // 방의 모든 사용자에게 socket 메세지 업데이트 이벤트를 발생시킵니다.
    if (!io || !roomId) {
      throw new IllegalArgumentsException();
    }

    const room = await roomModel.findById(roomId, "name part");
    if (!room) {
      throw new IllegalArgumentsException();
    }
    const { part } = room;

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
export const startSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: corsWhiteList,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  io.engine.use(sessionMiddleware);
  // app.use(buddyTokenMiddleware)는 핸드셰이크에서 실행되지 않으므로 소켓에도 등록합니다.
  io.use(buddySocketMiddleware);

  io.on("connection", (socket) => {
    try {
      const req = socket.request as Request;
      const bearerToken = getBearerToken(req);
      const joinRooms = () => {
        const { oid: userOid } = getLoginInfo(req);
        if (!userOid) {
          return socket.disconnect();
        }

        socket.join(getSessionRoom(req));
        socket.join(`user-${userOid}`);
      };

      if (bearerToken) {
        joinRooms();
      } else {
        req.session.reload((err) => {
          if (err) {
            return socket.disconnect();
          }
          joinRooms();
        });
      }

      socket.on("disconnect", () => {});
    } catch (err) {
      logger.error(err);
    }
  });

  return io;
};

export const getSessionRoom = (req: Request) => {
  const bearerToken = getBearerToken(req);
  return bearerToken ? `token-${bearerToken}` : `session-${req.session.id}`;
};
