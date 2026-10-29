import { Types } from "mongoose";
import {
  externalNotificationApiBaseUrl,
  externalNotificationApiKey,
} from "@/loadenv";
import logger from "@/modules/logger";
import { resolveS3Url } from "@/modules/stores/aws";
import { chatModel, roomModel, userModel } from "@/modules/stores/mongo";
import type { ChatType } from "@/types/mongo";

/**
 * Buddy 앱 알림 전송을 담당하는 모듈입니다.
 * Buddy 앱은 Taxi 서버에 FCM 토큰을 등록하지 않으므로, Taxi 서버는 방 참여자를 기준으로
 * Buddy 백엔드의 외부 알림 API(`/v1/notification/external/send`)를 호출하고,
 * Buddy 백엔드가 해당 사용자의 기기로 푸시를 보냅니다.
 */

/** Buddy 앱에서 지원하지 않는 미니게임 채팅은 알림도, 안 읽은 채팅 수도 만들지 않습니다. */
export const minigameChatTypes: ChatType[] = ["wordChain", "racing", "raceLog"];

/** 사람이 보낸 대화로 표시되는 채팅 유형입니다. 나머지는 방 이벤트로 표시됩니다. */
const conversationChatTypes: ChatType[] = ["text", "s3img", "account"];

/**
 * Buddy 백엔드의 알림 종류 (NotificationCategory). 사용자는 Buddy 앱 설정에서 기기마다 이를 끌 수 있고,
 * 끈 기기에는 알림이 가지 않습니다. 앱도 같은 값을 data.category로 받아 알림 모양을 정합니다.
 */
const chatCategory = "taxi_chat";
const eventCategory = "taxi_event";

/** iOS 알림 카테고리. 앱이 이 카테고리에 빠른 답장 액션을 등록합니다. */
const iosReplyCategory = "TAXI_CHAT";

/** 알림 본문으로 보낼 텍스트 채팅의 최대 길이입니다. */
const maxBodyLength = 300;

type ReadState = { roomId: Types.ObjectId | string; readAt?: Date | null };

// aggregate의 $match는 문자열을 ObjectId로 변환하지 않으므로 직접 변환합니다.
const unreadChatsQuery = (
  userOid: Types.ObjectId | string,
  readStates: ReadState[]
) => ({
  $or: readStates.map(({ roomId, readAt }) => ({
    roomId: new Types.ObjectId(roomId),
    time: { $gt: readAt ?? new Date(0) },
  })),
  authorId: { $ne: new Types.ObjectId(userOid) },
  isValid: true,
  type: { $nin: minigameChatTypes },
});

/**
 * 사용자가 참여한 방들의 안 읽은 채팅 수를 방 ObjectId 문자열을 key로 하여 반환합니다.
 * 사용자가 마지막으로 읽은 시각(part.readAt) 이후에 다른 사람이 보낸 유효한 채팅을 셉니다.
 * @param userOid - 사용자의 ObjectId입니다.
 * @param roomIds - 안 읽은 채팅 수를 셀 방들의 ObjectId입니다.
 */
export const getUnreadCounts = async (
  userOid: Types.ObjectId | string,
  roomIds: (Types.ObjectId | string)[]
) => {
  const counts: Record<string, number> = {};
  if (roomIds.length === 0) return counts;

  const rooms = await roomModel
    .find({ _id: { $in: roomIds } }, "part.user part.readAt")
    .lean();
  const readStates = rooms.map((room) => ({
    roomId: room._id,
    readAt: room.part.find(
      (participant) => participant.user.toString() === userOid.toString()
    )?.readAt,
  }));
  if (readStates.length === 0) return counts;

  const grouped = await chatModel.aggregate<{
    roomId: Types.ObjectId;
    n: number;
  }>([
    { $match: unreadChatsQuery(userOid, readStates) },
    { $group: { _id: "$roomId", n: { $sum: 1 } } },
    { $project: { _id: 0, roomId: "$_id", n: 1 } },
  ]);
  return grouped.reduce(
    (result, { roomId, n }) => ({ ...result, [roomId.toString()]: n }),
    counts
  );
};

/** 완료된 방은 출발 후 이 기간이 지나면 배지에 세지 않습니다. 오래된 방의 채팅이 배지를 영원히 남기지 않게 합니다. */
const doneRoomBadgeDays = 30;

/** 배지에 세는 완료된 방의 출발 시각 하한입니다. */
export const doneRoomBadgeCutoff = () =>
  new Date(Date.now() - doneRoomBadgeDays * 24 * 60 * 60 * 1000);

/**
 * 사용자의 배지에 세는 방들의 안 읽은 채팅 수를 방 ObjectId 문자열을 key로 하여 반환합니다.
 * 진행 중인 방 전부와 최근(`doneRoomBadgeDays`) 완료된 방을 셉니다.
 * @param userOid - 사용자의 ObjectId입니다.
 */
export const getBadgeUnreadCounts = async (userOid: Types.ObjectId | string) => {
  const user = await userModel.findById(userOid, "ongoingRoom doneRoom").lean();
  if (!user) return {};
  const recentDoneRooms = await roomModel
    .find(
      { _id: { $in: user.doneRoom }, time: { $gte: doneRoomBadgeCutoff() } },
      "_id"
    )
    .lean();
  return getUnreadCounts(userOid, [
    ...user.ongoingRoom,
    ...recentDoneRooms.map((room) => room._id),
  ]);
};

/**
 * 사용자의 안 읽은 채팅 수 합계를 반환합니다. Buddy 앱 아이콘 배지 숫자로 사용됩니다.
 * @param userOid - 사용자의 ObjectId입니다.
 */
export const getTotalUnreadCount = async (userOid: Types.ObjectId | string) =>
  Object.values(await getBadgeUnreadCounts(userOid)).reduce(
    (sum, n) => sum + n,
    0
  );

export interface BuddyChatNotification {
  roomId: string;
  roomName: string;
  chatId: string;
  type: ChatType;
  content: string;
  time: Date;
  author?: {
    oid: string;
    nickname: string;
    profileImageUrl?: string;
  };
  /** 입퇴장한 사용자들의 닉네임 ("in", "out" 채팅) */
  inOutNames?: string[];
}

interface BuddyPushText {
  title: string;
  body?: string;
  bodyLocKey?: string;
  bodyLocArgs?: string[];
}

/**
 * 채팅 유형에 따라 알림 제목과 본문을 만듭니다.
 * 대화(text, s3img, account)는 보낸 사람 닉네임이 제목이고,
 * 방 이벤트는 방 이름이 제목이며 본문은 앱에서 현지화되는 키로 보냅니다.
 */
export const buildBuddyPushText = (
  chat: BuddyChatNotification
): BuddyPushText | undefined => {
  const nickname = chat.author?.nickname ?? "";
  const names = chat.inOutNames?.length ? chat.inOutNames.join(", ") : nickname;

  switch (chat.type) {
    case "text":
      return {
        title: nickname,
        body:
          chat.content.length > maxBodyLength
            ? `${chat.content.slice(0, maxBodyLength - 1)}…`
            : chat.content,
      };
    case "s3img":
      return { title: nickname, bodyLocKey: "TAXI_CHAT_IMAGE" };
    case "account":
      return { title: nickname, bodyLocKey: "TAXI_CHAT_ACCOUNT" };
    case "in":
      return {
        title: chat.roomName,
        bodyLocKey: "TAXI_IN",
        bodyLocArgs: [names],
      };
    case "out":
      return {
        title: chat.roomName,
        bodyLocKey: "TAXI_OUT",
        bodyLocArgs: [names],
      };
    case "settlement":
      return {
        title: chat.roomName,
        bodyLocKey: "TAXI_SETTLEMENT",
        bodyLocArgs: [nickname],
      };
    case "payment":
      return {
        title: chat.roomName,
        bodyLocKey: "TAXI_PAYMENT",
        bodyLocArgs: [nickname],
      };
    case "departure":
      return {
        title: chat.roomName,
        bodyLocKey: "TAXI_DEPARTURE",
        bodyLocArgs: [chat.content],
      };
    case "arrival":
      return { title: chat.roomName, bodyLocKey: "TAXI_ARRIVAL" };
    default:
      // 미니게임 등 Buddy 앱에서 지원하지 않는 채팅은 알림을 보내지 않습니다.
      return undefined;
  }
};

/**
 * 한 사용자에게 보낼 Buddy 외부 알림 API 요청 body를 만듭니다.
 * @param chat - 알림을 보낼 채팅입니다.
 * @param recipientUid - 받는 사용자의 SSO uid (User.id) 입니다.
 * @param badge - 받는 사용자의 안 읽은 채팅 수 합계입니다.
 * @param roomUnread - 받는 사용자의 해당 방 안 읽은 채팅 수입니다.
 */
export const buildBuddyPushRequest = (
  chat: BuddyChatNotification,
  recipientUid: string,
  badge: number,
  roomUnread: number
) => {
  const text = buildBuddyPushText(chat);
  if (!text) return undefined;

  const category = conversationChatTypes.includes(chat.type)
    ? chatCategory
    : eventCategory;
  const data: Record<string, string> = {
    category,
    type: chat.type,
    room_id: chat.roomId,
    room_name: chat.roomName,
    chat_id: chat.chatId,
    sent_at: chat.time.toISOString(),
    room_unread: String(roomUnread),
    url: `/myroom/${chat.roomId}`,
  };
  if (chat.author) {
    data.sender_id = chat.author.oid;
    data.sender_name = chat.author.nickname;
    const avatarUrl = resolveS3Url(chat.author.profileImageUrl);
    if (avatarUrl) data.sender_avatar_url = avatarUrl;
  }
  if (chat.type === "s3img") {
    data.image_url = resolveS3Url(`chat-img/${chat.content}`)!;
  }

  return {
    user_uid: recipientUid,
    category,
    title: text.title,
    body: text.body ?? null,
    title_loc_key: null,
    title_loc_args: null,
    body_loc_key: text.bodyLocKey ?? null,
    body_loc_args: text.bodyLocKey ? (text.bodyLocArgs ?? []) : null,
    data,
    options: {
      mutable_content: true,
      thread_id: chat.roomId,
      badge,
      category: iosReplyCategory,
      sound: "default",
      android_data_only: true,
    },
  };
};

const postToBuddy = async (body: object) => {
  const endpoint = `${externalNotificationApiBaseUrl.replace(
    /\/+$/,
    ""
  )}/v1/notification/external/send`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-NOTIFICATION-API-KEY": externalNotificationApiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  // 404는 Buddy 앱에 기기가 없거나 알림을 끈 사용자이므로 정상입니다.
  if (!response.ok && response.status !== 404) {
    logger.error(
      `External notification API returned status ${response.status}.`
    );
  }
};

/**
 * 채팅이 생긴 방의 참여자들에게 Buddy 앱 알림을 보냅니다.
 * 보낸 사람은 제외하며, 각 참여자의 안 읽은 채팅 수를 배지로 함께 보냅니다.
 * Buddy 백엔드가 설정되지 않았거나 지원하지 않는 채팅 유형이면 아무 것도 하지 않습니다.
 * @param chat - 알림을 보낼 채팅입니다.
 * @param participantOids - 방 참여자들의 ObjectId입니다.
 */
export const notifyBuddyParticipants = async (
  chat: BuddyChatNotification,
  participantOids: string[]
) => {
  if (!externalNotificationApiBaseUrl && !externalNotificationApiKey) return;
  if (!externalNotificationApiBaseUrl || !externalNotificationApiKey) {
    logger.error("External notification API URL or API key is not configured.");
    return;
  }
  if (!buildBuddyPushText(chat)) return;

  const recipientOids = participantOids.filter(
    (oid) => oid !== chat.author?.oid
  );
  const recipients = await userModel
    .find({ _id: { $in: recipientOids }, withdraw: false }, "_id id")
    .lean();

  await Promise.all(
    recipients.map(async (recipient) => {
      try {
        // 이 방을 포함한 배지 대상 방들을 한 번에 셉니다.
        const counts = await getBadgeUnreadCounts(recipient._id);
        const badge = Object.values(counts).reduce((sum, n) => sum + n, 0);
        const body = buildBuddyPushRequest(
          chat,
          recipient.id,
          badge,
          counts[chat.roomId] ?? 0
        );
        if (body) await postToBuddy(body);
      } catch (error) {
        logger.error(error);
      }
    })
  );
};
