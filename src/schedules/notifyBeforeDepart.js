const { roomModel, chatModel } = require("../modules/stores/mongo");
const { emitChatEvent } = require("../modules/socket");
const logger = require("../modules/logger");

const MS_PER_MINUTE = 60000;

/**
 * 출발까지 15분 남은 방들에 참여하고 있는 사용자들에게 리마인더 알림을 전송합니다.
 * @summary 메시지는 보내지 않습니다. ㅎㅎ
 * @return {Promise<Number>} 알림 전송에 실패한 기기 수를 반환합니다.
 */

module.exports = (app) => async () => {
  try {
    const io = app.get("io");
    const currentDate = new Date(Date.now()).toISOString();
    const departDate = new Date(Date.now() + 15 * MS_PER_MINUTE).toISOString();

    const candidatesRooms = await roomModel.find({
      $and: [
        { time: { $gte: currentDate } },
        { time: { $lte: departDate } },
        { "part.1": { $exists: true } },
      ],
    });

    await Promise.all(
      candidatesRooms.map(async ({ _id: roomId, time }) => {
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
