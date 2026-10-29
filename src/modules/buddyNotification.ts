import { Types } from "mongoose";
import { chatModel, roomModel, userModel } from "@/modules/stores/mongo";
import type { ChatType } from "@/types/mongo";

/** Buddy 앱에서 지원하지 않는 미니게임 채팅은 알림도, 안 읽은 채팅 수도 만들지 않습니다. */
export const minigameChatTypes: ChatType[] = ["wordChain", "racing", "raceLog"];

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

/**
 * 사용자가 참여한 모든 방(진행중, 완료)의 안 읽은 채팅 수 합계를 반환합니다.
 * Buddy 앱 아이콘 배지 숫자로 사용됩니다.
 */
export const getTotalUnreadCount = async (userOid: Types.ObjectId | string) => {
  const user = await userModel.findById(userOid, "ongoingRoom doneRoom").lean();
  if (!user) return 0;
  const counts = await getUnreadCounts(userOid, [
    ...user.ongoingRoom,
    ...user.doneRoom,
  ]);
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
};
