const { roomModel, chatModel } = require("../modules/stores/mongo");
// const { roomPopulateOption } = require("../modules/populates/rooms");
const { emitChatEvent } = require("../modules/socket");
const logger = require("../modules/logger");

const MS_PER_MINUTE = 60000;

/**
 * 출발 한시간 이후 정산/송금하기를 완료하지 않은 사용자가 있다면 알림을 전송합니다.
 */

module.exports = (app) => async () => {
  try {
    const io = app.get("io");
    const expiredDate = new Date(Date.now() - 90 * MS_PER_MINUTE).toISOString();
    const arrivalDate = new Date(Date.now() - 60 * MS_PER_MINUTE).toISOString();

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
