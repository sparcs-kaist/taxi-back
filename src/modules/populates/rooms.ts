import {
  type User,
  type SettlementStatus,
  type Participant,
  type Room,
  type Location,
} from "@/types/mongo";

/**
 * 쿼리를 통해 얻은 Room Document를 populate할 설정값을 정의합니다.
 * @constant {{path: string, select: string, populate?: {path: string, select: string}}[]}
 */
export const roomPopulateOption = [
  { path: "from", select: "_id koName enName" },
  { path: "to", select: "_id koName enName" },
  {
    path: "part",
    select: "-_id user settlementStatus readAt",
    populate: { path: "user", select: "_id id name nickname profileImageUrl" },
  },
];

interface PopulatedParticipant
  extends Pick<Participant, "settlementStatus" | "readAt"> {
  user: Pick<User, "_id" | "id" | "name" | "nickname" | "profileImageUrl">;
}

export interface PopulatedRoom extends Omit<Room, "from" | "to" | "part"> {
  from: Pick<Location, "_id" | "koName" | "enName">;
  to: Pick<Location, "_id" | "koName" | "enName">;
  part?: PopulatedParticipant[];
}

export interface FormattedRoom
  extends Omit<PopulatedRoom, "part" | "settlementTotal"> {
  part?: {
    _id: string;
    name: string;
    nickname: string;
    profileImageUrl: string;
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
 * @param {PopulatedRoom} roomObject - 정산 정보를 가공할 room Object로, Mongoose Document가 아닌 순수 Javascript Object여야 합니다.
 * @param {Object} options - 추가 파라미터로, 기본값은 {}입니다.
 * @param {Boolean} options.includeSettlement - 반환 결과에 정산 정보를 포함할 지 여부로, 기본값은 true입니다.
 * @param {Date} options.timestamp - 방의 출발 여부(isDeparted)를 판단하는 기준이 되는 시각입니다.
 * @param {Boolean} options.isOver - 방의 완료 여부(isOver)로, 기본값은 false입니다. includeSettlement가 false인 경우 roomDocument의 isOver 속성은 undefined로 설정됩니다.
 * @return {FormattedRoom} 정산 여부가 위와 같이 가공되고 isDeparted 속성이 추가된 Room Object가 반환됩니다.
 */
export const formatSettlement = (
  roomObject: PopulatedRoom,
  { includeSettlement = true, isOver = false, timestamp = Date.now() } = {}
): FormattedRoom => {
  return {
    ...roomObject,
    part: roomObject.part?.map((participantSubDocument) => {
      const { _id, name, nickname, profileImageUrl } =
        participantSubDocument.user;
      const { settlementStatus, readAt } = participantSubDocument;
      return {
        _id,
        name,
        nickname,
        profileImageUrl,
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
 * roomPopulateOption을 사용해 populate된 Room Object와 사용자의 id(userId)가 주어졌을 때, 해당 사용자의 정산 상태를 반환합니다.
 * @param {PopulatedRoom} roomObject - roomPopulateOption을 사용해 populate된 변환한 Room Object입니다.
 * @param {String} userId - 방 완료 상태를 확인하려는 사용자의 id(user.id)입니다.
 * @return {Boolean | undefined} 사용자의 해당 방에 대한 완료 여부(true | false)를 반환합니다. 사용자가 참여중인 방이 아닐 경우 undefined를 반환합니다.
 **/
export const getIsOver = (roomObject: PopulatedRoom, userId: string) => {
  // room document의 part subdoocument에서 사용자 id와 일치하는 정산 정보를 찾습니다.
  const participantSubDocuments = roomObject.part?.filter((part) => {
    return part.user.id === userId;
  });

  // 방에 참여중이지 않은 사용자의 경우, undefined을 반환합니다.
  if (!participantSubDocuments || participantSubDocuments.length === 0)
    return undefined;

  // 방에 참여중인 사용자의 경우, 정산 상태가 완료된 것인지("paid"거나 "sent"인지)를 반환합니다.
  return ["paid", "sent"].includes(participantSubDocuments[0].settlementStatus);
};