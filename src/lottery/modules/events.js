const {
  eventStatusModel,
  eventModel,
  transactionModel,
} = require("./stores/mongo");
const logger = require("../../modules/logger");

const eventHandler = async (userId, eventId) => {
  try {
    logger.info(
      `eventHandler(userId=${userId}, eventId=${eventId}) 함수가 호출되었습니다.`
    );

    const event = await eventModel.findOne({ _id: eventId }).lean();
    if (!event) {
      logger.error(`알 수 없는 이벤트 ID 입니다: ${eventId}`); // 프로그래머의 실수로 인해서만 발생하므로 logger를 통해 오류를 알립니다.
      return null;
    }

    const eventStatus = await eventStatusModel.findOne({ userId }).lean();
    const eventCount = eventStatus.eventList.filter(
      (event) => event.toString() === eventId
    ).length;
    if (eventCount >= event.maxCount) {
      logger.info(
        `eventHandler(userId=${userId}, eventId=${eventId}) 함수가 종료되었습니다: 이미 최대로 달성한 이벤트입니다.`
      );
      return null;
    }

    const now = Date.now();
    if (now < event.startat || now > event.expireat) {
      logger.info(
        `eventHandler(userId=${userId}, eventId=${eventId}) 함수가 종료되었습니다: 달성할 수 있는 기간이 아닙니다.`
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

    logger.info(
      `eventHandler(userId=${userId}, eventId=${eventId}) 함수가 종료되었습니다: 성공했습니다.`
    );
    return {
      event,
      transactionId: transaction._id,
    };
  } catch (err) {
    logger.error(
      `eventHandler(userId=${userId}, eventId=${eventId}) 함수에서 예외가 발생했습니다: ${err}`
    );
    return null;
  }
};

module.exports = {
  eventHandler,
};
