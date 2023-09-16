const {
  eventStatusModel,
  eventModel,
  transactionModel,
} = require("./stores/mongo");
const logger = require("../../modules/logger");

const eventHandler = async (userId, event) => {
  try {
    const eventStatus = await eventStatusModel.findOne({ userId }).lean();
    const eventCount = eventStatus.eventList.filter(
      (achievedEventId) => achievedEventId === event.id
    ).length;
    const eventMaxCount = event.maxCount ? event.maxCount : 1;
    if (eventCount >= eventMaxCount) {
      logger.info(
        `User ${userId} already achieved ${event.id}Event ${eventCount} times`
      );
      return null;
    }

    const eventDoc = await eventModel.findOne({ id: event.id }).lean();
    if (eventDoc && eventDoc.isDisabled) {
      logger.info(`User ${userId} failed to achieve disabled ${event.id}Event`);
      return null;
    }

    await eventStatusModel.updateOne(
      { userId },
      {
        $inc: {
          creditAmount: event.rewardAmount,
        },
        $push: {
          eventList: event.id,
        },
      }
    );

    const transaction = new transactionModel({
      type: "get",
      amount: event.rewardAmount,
      userId,
      eventId: event.id,
      comment: `${event.name} 달성 - ${event.rewardAmount}개 획득`,
    });
    await transaction.save();

    logger.info(`User ${userId} successfully achieved ${event.id}Event`);
    return {
      event,
      transactionId: transaction._id,
    };
  } catch (err) {
    logger.error(err);
    logger.error(
      `User ${userId} failed to achieve ${event.id}Event due to exception`
    );
    return null;
  }
};

module.exports = {
  eventHandler,
};
