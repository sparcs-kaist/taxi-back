const { roomModel, chatModel } = require("@/modules/stores/mongo");
// const { roomPopulateOption } = require("@/modules/populates/rooms");
const { emitChatEvent } = require("@/modules/socket");
const logger = require("@/modules/logger").default;

const MS_PER_MINUTE = 60000;

/**
 * 출발 한시간 이후 정산/송금하기를 완료하지 않은 사용자가 있다면 알림을 전송합니다.
 */

module.exports = (app) => async () => {
  try {
    const io = app.get("io");
    const expiredDate = new Date(Date.now() - 90 * MS_PER_MINUTE).toISOString();
    const arrivalDate = new Date(Date.now() - 60 * MS_PER_MINUTE).toISOString();

    /**
     * 알림을 전송하는 방의 첫 번째 조건은 다음과 같습니다.
     * - 출발한 지 60분 이상 90분 이하가 지나야 합니다.
     * - 결제를 진행한 사용자가 없거나, 결제가 진행된 후 정산을 하지 않은 사용자가 있어야 합니다.
     */
    const candidateRooms = await roomModel.find({
      $and: [
        { time: { $gte: expiredDate } },
        { time: { $lte: arrivalDate } },
        {
          part: {
            $elemMatch: { settlementStatus: { $nin: ["paid", "sent"] } },
          },
        },
      ],
    });

    await Promise.all(
      candidateRooms.map(async ({ _id: roomId, time }) => {
        /**
         * 알림을 전송하는 방의 두 번째 조건은 다음과 같습니다.
         * - '출발 후 알림'이 아직 전송되지 않았어야 합니다.
         * 모든 조건에 만족이 되면 해당 방에 참여 중인 모든 사용자에게 알림이 전송됩니다.
         */
        const countArrivalChat = await chatModel.countDocuments({
          roomId,
          type: "arrival",
        });
        if (countArrivalChat > 0) return;
        const minuteDiff = Math.floor((Date.now() - time) / MS_PER_MINUTE);
        if (minuteDiff <= 0) return;
        await emitChatEvent(io, {
          roomId: roomId,
          type: "arrival",
          content: minuteDiff.toString(),
        });
      })
    );
  } catch (err) {
    logger.error(err);
  }
};
