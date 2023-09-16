const {
  eventStatusModel,
  questModel,
  transactionModel,
} = require("./stores/mongo");
const logger = require("../../modules/logger");
const mongoose = require("mongoose");

/**
 * 퀘스트 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {Object} quest - 퀘스트의 정보입니다.
 * @param {string} quest.id - 퀘스트의 Id입니다.
 * @param {string} quest.name - 퀘스트의 이름입니다.
 * @param {number} quest.rewardAmount - 퀘스트의 완료 보상입니다.
 * @param {number} quest.maxCount - 퀘스트의 최대 완료 가능 횟수입니다.
 * @returns {Object|null} 성공한 경우 Object를, 실패한 경우 null을 반환합니다. 이미 최대 완료 횟수에 도달했거나, 퀘스트가 원격으로 비활성화 된 경우에도 실패로 처리됩니다.
 */
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
