const {
  eventStatusModel,
  eventModel,
  transactionModel,
} = require("./stores/mongo");
const logger = require("../../modules/logger");

const eventHandler = async (userId, eventId) => {
  const event = await eventModel.findOne({ _id: eventId }).lean();
  if (!event) {
    logger.error(`알 수 없는 이벤트 ID 입니다: ${eventId}`); // 프로그래머의 실수로 인해서만 발생하므로 logger를 통해 오류를 알립니다.
    return null;
  }

  const eventStatus = await eventStatusModel.findOne({ userId }).lean();
  const eventCount = eventStatus.eventList.filter(
    (event) => event.toString() === eventId
  ).length;
  if (eventCount >= event.maxCount) return null; // 이미 최대로 달성한 이벤트입니다.

  await eventStatusModel.updateOne(
    { userId },
    {
      $inc: {
        creditAmount: event.rewardAmount,
      },
      $push: {
        eventList: eventId,
      },
    }
  );

  const transaction = new transactionModel({
    type: "get",
    amount: event.rewardAmount,
    userId,
    event: eventId,
    comment: `${event.name} 달성 - ${event.rewardAmount}개 획득`,
  });
  await transaction.save();

  return {
    event,
    transactionId: transaction._id,
  };
};

module.exports = {
  eventHandler,
};
