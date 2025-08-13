import type {
  User,
  SettlementStatus,
  Participant,
  Room,
  Location,
} from "@/types/mongo";
import { chatModel } from "@/modules/stores/mongo";

/**
 * 쿼리를 통해 얻은 Room Document를 populate할 설정값을 정의합니다.
 */
export const roomPopulateOption = [
  { path: "from", select: "_id koName enName" },
  { path: "to", select: "_id koName enName" },
  {
    path: "part",
    select: "-_id user settlementStatus readAt",
    populate: {
      path: "user",
      select: "_id id name nickname profileImageUrl withdraw badge",
    },
  },
];

interface PopulatedParticipant
  extends Pick<Participant, "settlementStatus" | "readAt"> {
  user: Pick<
    User,
    | "_id"
    | "id"
    | "name"
    | "nickname"
    | "profileImageUrl"
    | "withdraw"
    | "badge"
  > | null;
}

export interface PopulatedRoom extends Omit<Room, "from" | "to" | "part"> {
  from: Pick<
    Location,
    "_id" | "koName" | "enName" | "latitude" | "longitude"
  > | null;
  to: Pick<
    Location,
    "_id" | "koName" | "enName" | "latitude" | "longitude"
  > | null;
  part: PopulatedParticipant[];
}

interface FormattedLocation {
  _id: string;
  enName: string;
  koName: string;
  latitude: number;
  longitude: number;
}

export interface FormattedRoom {
  _id: string;
  name: string;
  from: FormattedLocation;
  to: FormattedLocation;
  time: Date;
  madeat: Date;
  maxPartLength: number;
  part: {
    _id: string;
    name: string;
    nickname: string;
    profileImageUrl: string;
    withdraw: boolean;
    isSettlement?: SettlementStatus;
    readAt: Date;
  }[];
  settlementTotal?: number;
  isOver?: boolean;
  isDeparted: boolean;
}

/**
 * Room Object가 주어졌을 때 room의 part array의 각 요소를 API 명세에서와 같이 {userId: String, ... , isSettlement: String}으로 가공합니다.
 * 또한, 방이 현재 출발했는지 유무인 isDeparted 속성을 추가합니다.
 * @param roomObject - 정산 정보를 가공할 room Object로, Mongoose Document가 아닌 순수 Javascript Object여야 합니다.
 * @param options - 추가 파라미터로, 기본값은 {}입니다.
 * @param options.includeSettlement - 반환 결과에 정산 정보를 포함할 지 여부로, 기본값은 true입니다.
 * @param options.timestamp - 방의 출발 여부(isDeparted)를 판단하는 기준이 되는 시각입니다.
 * @param options.isOver - 방의 완료 여부(isOver)로, 기본값은 false입니다. includeSettlement가 false인 경우 roomDocument의 isOver 속성은 undefined로 설정됩니다.
 * @return 정산 여부가 위와 같이 가공되고 isDeparted 속성이 추가된 Room Object가 반환됩니다.
 */
export const formatSettlement = (
  roomObject: PopulatedRoom,
  { includeSettlement = true, isOver = false, timestamp = Date.now() } = {}
): FormattedRoom => {
  return {
    ...roomObject,
    _id: roomObject._id!.toString(),
    from: {
      _id: roomObject.from!._id!.toString(),
      enName: roomObject.from!.enName,
      koName: roomObject.from!.koName,
      latitude: roomObject.from!.latitude,
      longitude: roomObject.from!.longitude,
    },
    to: {
      _id: roomObject.to!._id!.toString(),
      enName: roomObject.to!.enName,
      koName: roomObject.to!.koName,
      latitude: roomObject.to!.latitude,
      longitude: roomObject.to!.longitude,
    },
    part: roomObject.part.map((participantSubDocument) => {
      const { _id, name, nickname, profileImageUrl, withdraw, badge } =
        participantSubDocument.user!;
      const { settlementStatus, readAt } = participantSubDocument;
      return {
        _id: _id!.toString(),
        name,
        nickname,
        profileImageUrl,
        withdraw,
        badge,
        isSettlement: includeSettlement ? settlementStatus : undefined,
        readAt: readAt ?? roomObject.madeat,
      };
    }),
    settlementTotal: includeSettlement ? roomObject.settlementTotal : undefined,
    isOver: includeSettlement ? isOver : undefined,
    isDeparted: new Date(roomObject.time) < new Date(timestamp),
  };
};

/**
 * roomPopulateOption을 사용해 populate된 Room Object와 사용자의 objectId가 주어졌을 때, 해당 사용자의 정산 상태를 반환합니다.
 * @param roomObject - roomPopulateOption을 사용해 populate된 변환한 Room Object입니다.
 * @param userOid - 방 완료 상태를 확인하려는 사용자의 objectId입니다.
 * @return 사용자의 해당 방에 대한 완료 여부(true | false)를 반환합니다. 사용자가 참여중인 방이 아닐 경우 undefined를 반환합니다.
 **/
export const getIsOver = (roomObject: PopulatedRoom, userOid: string) => {
  // room document의 part subdoocument에서 사용자 id와 일치하는 정산 정보를 찾습니다.
  const participantSubDocuments = roomObject.part?.filter((part) => {
    return part.user?._id?.toString() === userOid;
  });

  // 방에 참여중이지 않은 사용자의 경우, undefined을 반환합니다.
  if (!participantSubDocuments || participantSubDocuments.length === 0)
    return undefined;

  // 방에 참여중인 사용자의 경우, 정산 상태가 완료된 것인지("paid"거나 "sent"인지)를 반환합니다.
  return ["paid", "sent"].includes(participantSubDocuments[0].settlementStatus);
};

/**
 * 주어진 방에서 사용자의 unread count를 계산합니다.
 * @param roomId - 방의 ObjectId
 * @param userOid - 사용자의 ObjectId
 * @param userReadAt - 사용자가 마지막으로 읽은 시간 (참여자의 readAt 필드)
 * @return 읽지 않은 메시지 개수와 중요한 메시지 여부를 반환합니다.
 */
export const calculateUnreadCount = async (
  roomId: string,
  userOid: string,
  userReadAt?: Date
): Promise<{ unreadCount: number; hasImportantMessage: boolean }> => {
  try {
    // 사용자가 한 번도 읽지 않았다면 (readAt이 없다면) 모든 메시지를 unread로 간주
    if (!userReadAt) {
      const totalCount = await chatModel.countDocuments({
        roomId,
        type: { $in: ["text", "s3img"] },
        authorId: { $ne: userOid }, // 본인 메시지는 제외
      });

      // 중요한 메시지가 있는지 확인
      const importantCount = await chatModel.countDocuments({
        roomId,
        type: { $in: ["payment", "settlement", "account", "in", "out"] },
        authorId: { $ne: userOid }, // 본인 메시지는 제외
      });

      return {
        unreadCount: totalCount,
        hasImportantMessage: importantCount > 0,
      };
    }

    // readAt 이후의 메시지 개수를 계산 (본인 메시지 제외)
    const unreadCount = await chatModel.countDocuments({
      roomId,
      type: { $in: ["text", "s3img"] },
      time: { $gt: userReadAt },
      authorId: { $ne: userOid }, // 본인 메시지는 제외
    });

    // readAt 이후의 중요한 메시지가 있는지 확인
    const importantCount = await chatModel.countDocuments({
      roomId,
      type: { $in: ["payment", "settlement", "account", "in", "out"] },
      time: { $gt: userReadAt },
      authorId: { $ne: userOid }, // 본인 메시지는 제외
    });

    return {
      unreadCount,
      hasImportantMessage: importantCount > 0,
    };
  } catch (error) {
    console.error(`Error calculating unread count for room ${roomId}:`, error);
    return { unreadCount: 0, hasImportantMessage: false };
  }
};
