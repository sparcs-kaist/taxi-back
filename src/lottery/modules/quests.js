const {
  eventStatusModel,
  questModel,
  transactionModel,
} = require("./stores/mongo");
const logger = require("../../modules/logger");

const completeQuest = async (userId, quest) => {
  try {
    const eventStatus = await eventStatusModel.findOne({ userId }).lean();
    const questCount = eventStatus.completedQuests.filter(
      (completedQuestId) => completedQuestId === quest.id
    ).length;
    if (questCount >= quest.maxCount) {
      logger.info(
        `User ${userId} already completed ${quest.id}Quest ${questCount} times`
      );
      return null;
    }

    const questDoc = await questModel.findOne({ id: quest.id }).lean();
    if (questDoc && questDoc.isDisabled) {
      logger.info(
        `User ${userId} failed to complete disabled ${quest.id}Quest`
      );
      return null;
    }

    await eventStatusModel.updateOne(
      { userId },
      {
        $inc: {
          creditAmount: quest.rewardAmount,
        },
        $push: {
          completedQuests: quest.id,
        },
      }
    );

    const transaction = new transactionModel({
      type: "get",
      amount: quest.rewardAmount,
      userId,
      questId: quest.id,
      comment: `${quest.name} 달성 - ${quest.rewardAmount}개 획득`,
    });
    await transaction.save();

    logger.info(`User ${userId} successfully completed ${quest.id}Quest`);
    return {
      quest,
      transactionId: transaction._id,
    };
  } catch (err) {
    logger.error(err);
    logger.error(
      `User ${userId} failed to complete ${quest.id}Quest due to exception`
    );
    return null;
  }
};

module.exports = {
  completeQuest,
};
