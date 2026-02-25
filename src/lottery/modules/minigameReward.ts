import mongoose, { Types } from "mongoose";
import { eventStatusModel, transactionModel } from "./stores/mongo";
import logger from "@/modules/logger";
import { eventConfig } from "@/loadenv";

export const eventPeriod = eventConfig && {
  startAt: new Date(eventConfig.period.startAt),
  endAt: new Date(eventConfig.period.endAt),
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const getKstDayRange = (nowMs = Date.now()) => {
  const kstMs = nowMs + KST_OFFSET_MS;
  const startKstMs = Math.floor(kstMs / DAY_MS) * DAY_MS;
  const endKstMs = startKstMs + DAY_MS;

  // Date는 UTC 기준으로 저장되므로 다시 UTC로 환산
  return {
    start: new Date(startKstMs - KST_OFFSET_MS),
    end: new Date(endKstMs - KST_OFFSET_MS),
  };
};

export const minigameReward = async (
  amount: number,
  userId: string | undefined,
  minigameName: string
) => {
  const DAILY_MINIGAME_CAP =
    minigameName === "dodgePoop"
      ? 5000
      : minigameName === "wordChain"
        ? 8000
        : 1000000;
  if (!userId) return null;

  const requestedAmount = Math.floor(amount);
  if (!Number.isFinite(requestedAmount)) return;

  try {
    const timestamp = Date.now();

    // 1) 이벤트 상태 확인(차단 포함)
    const eventStatus = await eventStatusModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean();

    if (!eventStatus || eventStatus.isBanned) return;

    // 2) 이벤트 기간 체크
    if (
      !eventPeriod ||
      timestamp >= eventPeriod.endAt.getTime() ||
      timestamp < eventPeriod.startAt.getTime()
    ) {
      logger.info(`User ${userId} failed to complete auto-disabled miniGame`);
      return;
    }

    // 3) 오늘 이미 받은 총합 계산
    const { start, end } = getKstDayRange(timestamp);

    const userObjectId = new Types.ObjectId(userId);

    const agg = await transactionModel.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: "get",
          comment: minigameName,
          createdAt: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const earnedToday = agg[0]?.total ?? 0;
    const remaining = DAILY_MINIGAME_CAP - earnedToday;

    // 이미 상한에 도달 시 무시
    if (remaining <= 0) {
      logger.info(
        `User ${userId} reached daily cap. earnedToday=${earnedToday}, cap=${DAILY_MINIGAME_CAP}`
      );
      return;
    }

    // 만약 넘친다면 남은 부분만 지급
    const grantAmount = Math.min(
      requestedAmount,
      remaining <= 0 ? 0 : remaining
    );

    // 4) EventStatus 포인트 지급
    await eventStatusModel.updateOne(
      { userId },
      { $inc: { creditAmount: grantAmount } }
    );

    // 5) Transaction 기록 생성
    const [tx] = await transactionModel.create([
      {
        type: grantAmount >= 0 ? "get" : "use",
        amount: grantAmount,
        userId: userObjectId,
        comment: minigameName,
      },
    ]);

    logger.info(
      `User ${userId} rewarded miniGame. requested=${requestedAmount}, granted=${grantAmount}, earnedToday=${earnedToday}, cap=${DAILY_MINIGAME_CAP}, name=${minigameName}`
    );

    return [tx._id];
  } catch (err) {
    logger.error(err);
    logger.error(
      `User ${userId} failed to reward ${amount} for a minigame due to exception`
    );
    return;
  } finally {
  }
};
