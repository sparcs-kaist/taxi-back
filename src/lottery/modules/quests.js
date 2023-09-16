const {
  eventStatusModel,
  questModel,
  transactionModel,
} = require("./stores/mongo");
const logger = require("../../modules/logger");
const mongoose = require("mongoose");

const requiredQuestFields = ["name", "description", "imageUrl", "rewardAmount"];
const buildQuests = (quests) => {
  for (const [id, quest] of Object.entries(quests)) {
    const hasError = requiredQuestFields.reduce((before, field) => {
      if (quest[field] !== undefined) return before;

      logger.error(`There is no ${field} field in ${id}Quest`);
      return true;
    }, false);
    if (hasError) return null;

    quest.id = id;

    if (!quest.maxCount) {
      quest.maxCount = 1;
    }
  }

  return quests;
};

/**
 * 퀘스트 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {Object} eventPeriod - 이벤트의 기간입니다.
 * @param {Date} eventPeriod.start - 이벤트의 시작 시각(Inclusive)입니다.
 * @param {Date} eventPeriod.end - 이벤트의 종료 시각(Exclusive)입니다.
 * @param {Object} quest - 퀘스트의 정보입니다.
 * @param {string} quest.id - 퀘스트의 Id입니다.
 * @param {string} quest.name - 퀘스트의 이름입니다.
 * @param {number} quest.rewardAmount - 퀘스트의 완료 보상입니다.
 * @param {number} quest.maxCount - 퀘스트의 최대 완료 가능 횟수입니다.
 * @returns {Object|null} 성공한 경우 Object를, 실패한 경우 null을 반환합니다. 이미 최대 완료 횟수에 도달했거나, 퀘스트가 원격으로 비활성화 된 경우에도 실패로 처리됩니다.
 */
const completeQuest = async (userId, eventPeriod, quest) => {
  try {
    const now = Date.now();
    if (now >= eventPeriod.end || now < eventPeriod.start) {
      logger.info(
        `User ${userId} failed to complete auto-disabled ${quest.id}Quest`
      );
      return null;
    }

    let eventStatus = await eventStatusModel.findOne({ userId }).lean();
    if (!eventStatus) {
      eventStatus = new eventStatusModel({ userId });
      await eventStatus.save();
    }

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
  buildQuests,
  completeQuest,
};
