import {
  eventStatusModel,
  questModel,
  itemModel,
  transactionModel,
} from "./stores/mongo";
import logger from "@/modules/logger";
import type { Types } from "mongoose";
import { eventConfig } from "@/loadenv";
import type { EventPeriod, EventStatus, Quest } from "../types";

const eventPeriod: EventPeriod | null = eventConfig && {
  startAt: new Date(eventConfig.period.startAt),
  endAt: new Date(eventConfig.period.endAt),
};

const requiredQuestFields: string[] = [
  "name",
  "description",
  "imageUrl",
  "reward",
];

export const buildQuests = (
  quests: Record<string, Quest>
): Record<string, Required<Quest>> | null => {
  const updatedQuests: Record<string, Required<Quest>> = {};

  for (const [id, quest] of Object.entries(quests)) {
    const hasError = requiredQuestFields.reduce((before, field) => {
      if (quest[field as keyof Quest] !== undefined) return before;

      logger.error(`There is no ${field} field in ${id}Quest`);
      return true;
    }, false);
    if (hasError) return null;

    // 새로운 객체 생성
    updatedQuests[id] = {
      ...quest, // 기존 필드 복사
      id, // id 추가
      reward:
        typeof quest.reward === "number"
          ? { credit: quest.reward, ticket1: 0 }
          : {
              credit: quest.reward.credit ?? 0,
              ticket1: quest.reward.ticket1 ?? 0,
            },
      maxCount: quest.maxCount ?? 1,
      isApiRequired: quest.isApiRequired ?? false,
      isDisabled: false,
    };
  }

  return updatedQuests;
};

/**
 * 퀘스트 완료를 요청합니다.
 */
export const completeQuest = async (
  userId: Types.ObjectId | string,
  timestamp: number | Date,
  quest: Required<Quest>
): Promise<{
  quest: Quest;
  questCount: number;
  transactionsId: string[]; // ObjectId를 가져오기 때문에 number[]가 아닌 string[]로 저장.
} | null> => {
  try {
    // 1단계: 유저의 EventStatus를 가져옵니다. 블록드리스트인지도 확인합니다.
    const eventStatus: EventStatus | null = await eventStatusModel
      .findOne({ userId })
      .lean();
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
    const ticket1 = quest.reward.ticket1
      ? await itemModel.findOne({ itemType: 1 }).lean()
      : null;

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
    const transactionsId: string[] = [];
    if (quest.reward.credit) {
      const transaction = new transactionModel({
        type: "get",
        amount: quest.reward.credit,
        userId,
        questId: quest.id,
        comment: `"${quest.name}" 퀘스트를 완료해 ${eventConfig?.credit.name} ${quest.reward.credit}개를 획득했습니다.`,
      });
      await transaction.save();
      transactionsId.push(transaction._id.toString());
    }

    if (ticket1) {
      // quest.reward.ticket1가 없는 경우는 이미 앞에서 예외처리를 했으므로.
      const transaction = new transactionModel({
        type: "use",
        amount: 0,
        userId,
        questId: quest.id,
        itemId: ticket1._id,
        comment: `"${quest.name}" 퀘스트를 완료해 "${ticket1.name}" ${quest.reward.ticket1}개를 획득했습니다.`,
      });
      await transaction.save();
      transactionsId.push(transaction._id.toString());
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
