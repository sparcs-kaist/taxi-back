const {
  eventStatusModel,
  questModel,
  itemModel,
  transactionModel,
} = require("./stores/mongo");
const logger = require("@/modules/logger").default;
const mongoose = require("mongoose");

const { eventConfig } = require("@/loadenv");
const eventPeriod = eventConfig && {
  startAt: new Date(eventConfig.period.startAt),
  endAt: new Date(eventConfig.period.endAt),
};

const requiredQuestFields = ["name", "description", "imageUrl", "reward"];

const buildQuests = (quests) => {
  for (const [id, quest] of Object.entries(quests)) {
    // quest에 필수 필드가 모두 포함되어 있는지 확인합니다.
    const hasError = requiredQuestFields.reduce((before, field) => {
      if (quest[field] !== undefined) return before;

      logger.error(`There is no ${field} field in ${id}Quest`);
      return true;
    }, false);
    if (hasError) return null;

    // quest.id 필드를 설정합니다.
    quest.id = id;

    // quest.reward가 number인 경우, object로 변환합니다.
    if (typeof quest.reward === "number") {
      const credit = quest.reward;
      quest.reward = {
        credit,
      };
    }

    // quest.reward에 누락된 필드가 있는 경우, 기본값(0)으로 설정합니다.
    quest.reward.credit = quest.reward.credit ?? 0;
    quest.reward.ticket1 = quest.reward.ticket1 ?? 0;

    // quest.maxCount가 없는 경우, 기본값(1)으로 설정합니다.
    quest.maxCount = quest.maxCount ?? 1;

    // quest.isApiRequired가 없는 경우, 기본값(false)으로 설정합니다.
    quest.isApiRequired = quest.isApiRequired ?? false;
  }

  return quests;
};

/**
 * 퀘스트 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {Object} quest - 퀘스트의 정보입니다.
 * @param {string} quest.id - 퀘스트의 Id입니다.
 * @param {string} quest.name - 퀘스트의 이름입니다.
 * @param {Object} quest.reward - 퀘스트의 완료 보상입니다.
 * @param {number} quest.reward.credit - 퀘스트의 완료 보상 중 재화의 양입니다.
 * @param {number} quest.reward.ticket1 - 퀘스트의 완료 보상 중 일반 티켓의 개수입니다.
 * @param {number} quest.maxCount - 퀘스트의 최대 완료 가능 횟수입니다.
 * @returns {Object|null} 성공한 경우 Object를, 실패한 경우 null을 반환합니다. 이미 최대 완료 횟수에 도달했거나, 퀘스트가 원격으로 비활성화된 경우에도 실패로 처리됩니다.
 */
const completeQuest = async (userId, timestamp, quest) => {
  try {
    // 1단계: 유저의 EventStatus를 가져옵니다. 블록드리스트인지도 확인합니다.
    const eventStatus = await eventStatusModel.findOne({ userId }).lean();

    if (!eventStatus || eventStatus.isBanned) return null;

    // 2단계: 이벤트 기간인지 확인합니다.
    if (
      !eventPeriod ||
      timestamp >= eventPeriod.endAt ||
      timestamp < eventPeriod.startAt
    ) {
      logger.info(
        `User ${userId} failed to complete auto-disabled ${quest.id}Quest`
      );
      return null;
    }

    // 3단계: 유저의 퀘스트 완료 횟수를 확인합니다.
    // maxCount가 0인 경우, 무제한으로 퀘스트를 완료할 수 있습니다.
    const questCount = eventStatus.completedQuests.filter(
      ({ questId }) => questId === quest.id
    ).length;
    if (quest.maxCount > 0 && questCount >= quest.maxCount) {
      logger.info(
        `User ${userId} already completed ${quest.id}Quest ${questCount} times`
      );
      return null;
    }

    // 4단계: 원격으로 비활성화된 퀘스트인지 확인합니다.
    // 비활성화된 퀘스트만 DB에 저장할 것이기 때문에, questDoc이 null이어도 오류를 발생시키면 안됩니다.
    const questDoc = await questModel.findOne({ id: quest.id }).lean();
    if (questDoc?.isDisabled) {
      logger.info(
        `User ${userId} failed to complete disabled ${quest.id}Quest`
      );
      return null;
    }

    // 5단계: 완료 보상 중 티켓이 있는 경우, 티켓 정보를 가져옵니다.
    const ticket1 =
      quest.reward.ticket1 && (await itemModel.findOne({ itemType: 1 }).lean());
    if (quest.reward.ticket1 && !ticket1)
      throw new Error("Fail to find ticket1");

    // 6단계: 유저의 EventStatus를 업데이트합니다.
    await eventStatusModel.updateOne(
      { userId },
      {
        $inc: {
          creditAmount: quest.reward.credit,
          ticket1Amount: quest.reward.ticket1,
        },
        $push: {
          completedQuests: {
            questId: quest.id,
            completedAt: timestamp,
          },
        },
      }
    );

    // 7단계: Transaction을 생성합니다.
    const transactionsId = [];
    if (quest.reward.credit) {
      const transaction = new transactionModel({
        type: "get",
        amount: quest.reward.credit,
        userId,
        questId: quest.id,
        comment: `"${quest.name}" 퀘스트를 완료해 ${
          eventConfig?.credit?.name ?? "응모권"
        } ${quest.reward.credit}개를 획득했습니다.`,
      });
      await transaction.save();

      transactionsId.push(transaction._id);
    }
    if (quest.reward.ticket1) {
      const transaction = new transactionModel({
        type: "use",
        amount: 0,
        userId,
        questId: quest.id,
        itemId: ticket1._id,
        comment: `"${quest.name}" 퀘스트를 완료해 "${ticket1.name}" ${quest.reward.ticket1}개를 획득했습니다.`,
      });
      await transaction.save();

      transactionsId.push(transaction._id);
    }

    logger.info(`User ${userId} successfully completed ${quest.id}Quest`);
    return {
      quest,
      questCount: questCount + 1,
      transactionsId,
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
