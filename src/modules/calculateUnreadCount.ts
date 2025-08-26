import { chatModel, roomModel } from "@/modules/stores/mongo";

/**
 * 주어진 방에서 사용자의 unread count를 계산합니다.
 * @param roomId - 방의 ObjectId
 * @param userOid - 사용자의 ObjectId
 * @return 읽지 않은 메시지 개수와 중요한 메시지 여부를 반환합니다.
 */
export const calculateUnreadCount = async (
  roomId: string,
  userOid: string,
  userReadAt: Date | undefined
): Promise<{
  unreadCount: number;
  hasImportantMessage: boolean;
}> => {
  try {
    let readAt = userReadAt;
    // readAt이 없으면 DB에 현재시간(Date 객체)으로 set
    if (!readAt) {
      readAt = new Date();
      await roomModel.updateOne(
        { _id: roomId, "part.user": userOid },
        { $set: { "part.$.readAt": readAt } }
      );
    }

    // readAt 이후의 메시지 개수를 계산 (본인 메시지 제외)
    const unreadCount = await chatModel.countDocuments({
      roomId,
      type: { $in: ["text", "s3img"] },
      time: { $gt: readAt },
      authorId: { $ne: userOid },
    });
    const importantCount = await chatModel.countDocuments({
      roomId,
      type: { $in: ["payment", "settlement", "account", "in", "out"] },
      time: { $gt: readAt },
      authorId: { $ne: userOid },
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
