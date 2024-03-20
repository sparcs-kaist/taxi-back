const { roomModel, chatModel } = require("@/modules/stores/mongo");
const { emitChatEvent } = require("@/modules/socket");
const logger = require("@/modules/logger").default;

const MS_PER_MINUTE = 60000;

/**
 * 출발까지 15분 남은 방들에 참여하고 있는 사용자들에게 리마인더 알림을 전송합니다.
 */

module.exports = (app) => async () => {
  try {
    const io = app.get("io");
    const currentDate = new Date(Date.now()).toISOString();
    const departDate = new Date(Date.now() + 15 * MS_PER_MINUTE).toISOString();

    /**
     * 알림을 전송하는 방의 첫 번째 조건은 다음과 같습니다.
     * - 출출발까지 15분 이하가 남아있어야 합니다.
     * - 2명 이상이 방에 참여 중이어야 합니다.
     */
    const candidatesRooms = await roomModel.find({
      $and: [
        { time: { $gte: currentDate } },
        { time: { $lte: departDate } },
        { "part.1": { $exists: true } },
      ],
    });

    await Promise.all(
      candidatesRooms.map(async ({ _id: roomId, time }) => {
        /**
         * 알림을 전송하는 방의 두 번째 조건은 다음과 같습니다.
         * - '출발 후 알림'이 아직 전송되지 않았어야 합니다.
         * 모든 조건에 만족이 되면 해당 방에 참여 중인 모든 사용자에게 알림이 전송됩니다.
         */
        const countDepartureChat = await chatModel.countDocuments({
          roomId,
          type: "departure",
        });
        if (countDepartureChat > 0) return;
        const minuteDiff = Math.ceil((time - Date.now()) / MS_PER_MINUTE);
        if (minuteDiff <= 0) return;
        await emitChatEvent(io, {
          roomId: roomId,
          type: "departure",
          content: minuteDiff.toString(),
        });
      })
    );
  } catch (err) {
    logger.error(err);
  }
};
