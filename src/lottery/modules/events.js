const {
  eventStatusModel,
  eventModel,
  transactionModel,
} = require("./stores/mongo");
const logger = require("../../modules/logger");

const eventHandler = async (userId, eventName) => {
  try {
    logger.info(
      `eventHandler(userId=${userId}, eventName="${eventName}") 함수가 호출되었습니다.`
    );

    const event = await eventModel.findOne({ name: eventName }).lean();
    if (!event) {
      logger.error(
        `eventHandler(userId=${userId}, eventName="${eventName}") 함수에서 예외가 발생했습니다: 알 수 없는 이벤트 이름입니다.`
      );
      return null;
    } else if (event.isDisabled) {
      logger.info(
        `eventHandler(userId=${userId}, eventName="${eventName}") 함수가 종료되었습니다: 달성할 수 없는 이벤트입니다.`
      );
      return null;
    }

    const eventStatus = await eventStatusModel.findOne({ userId }).lean();
    const eventCount = eventStatus.eventList.filter(
      (achievedEventId) => achievedEventId.toString() === event._id.toString()
    ).length;
    if (eventCount >= event.maxCount) {
      logger.info(
        `eventHandler(userId=${userId}, eventName="${eventName}") 함수가 종료되었습니다: 이미 최대로 달성한 이벤트입니다.`
      );
      return null;
    }

    const now = Date.now();
    if (now < event.startat || now > event.expireat) {
      logger.info(
        `eventHandler(userId=${userId}, eventName="${eventName}") 함수가 종료되었습니다: 달성할 수 있는 기간이 아닙니다.`
      );
      return null;
    }

    await eventStatusModel.updateOne(
      { userId },
      {
        $inc: {
          creditAmount: event.rewardAmount,
        },
        $push: {
          eventList: event._id,
        },
      }
    );

    const transaction = new transactionModel({
      type: "get",
      amount: event.rewardAmount,
      userId,
      event: event._id,
      comment: `${event.name} 달성 - ${event.rewardAmount}개 획득`,
    });
    await transaction.save();

    logger.info(
      `eventHandler(userId=${userId}, eventName="${eventName}") 함수가 종료되었습니다: 성공했습니다.`
    );
    return {
      event,
      transactionId: transaction._id,
    };
  } catch (err) {
    logger.error(
      `eventHandler(userId=${userId}, eventName="${eventName}") 함수에서 예외가 발생했습니다: ${err}`
    );
    return null;
  }
};

module.exports = {
  eventHandler,
};
