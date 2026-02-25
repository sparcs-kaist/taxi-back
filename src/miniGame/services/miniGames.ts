import type { RequestHandler } from "express";
import { miniGameModel } from "../modules/mongo";
import { userModel } from "@/modules/stores/mongo";
import {
  eventStatusModel,
  transactionModel,
} from "@/lottery/modules/stores/mongo";

import { minigameReward, eventPeriod } from "@/lottery/modules/minigameReward";

import { getLoginInfo, isLogin } from "@/modules/auths/login";
import logger from "@/modules/logger";

type LevelUpProbInfoType = {
  success: number;
  maintain: number;
  fail: number;
  burst: number;
};
const levelUpProb: LevelUpProbInfoType[] = [
  { success: 100, maintain: 0, fail: 0, burst: 0 },
  { success: 100, maintain: 0, fail: 0, burst: 0 },
  { success: 95, maintain: 5, fail: 0, burst: 0 },
  { success: 90, maintain: 10, fail: 0, burst: 0 },
  { success: 85, maintain: 15, fail: 0, burst: 0 },
  { success: 80, maintain: 20, fail: 0, burst: 0 },
  { success: 70, maintain: 25, fail: 5, burst: 0 },
  { success: 65, maintain: 30, fail: 5, burst: 0 },
  { success: 55, maintain: 35, fail: 10, burst: 0 },
  { success: 50, maintain: 40, fail: 10, burst: 0 },
  { success: 40, maintain: 40, fail: 20, burst: 0 },
  { success: 35, maintain: 45, fail: 20, burst: 0 },
  { success: 30, maintain: 40, fail: 30, burst: 0 },
  { success: 25, maintain: 45, fail: 30, burst: 0 },
  { success: 15, maintain: 45, fail: 40, burst: 0 },
  { success: 10, maintain: 40, fail: 40, burst: 10 },
  { success: 8, maintain: 32, fail: 40, burst: 20 },
  { success: 5, maintain: 25, fail: 40, burst: 30 },
  { success: 3, maintain: 22, fail: 35, burst: 40 },
  { success: 2, maintain: 13, fail: 35, burst: 50 },
];

type ItemType =
  | "preventFail"
  | "preventBurst"
  | "makeLevel7"
  | "makeLevel10"
  | "makeLevel12";

const ITEM_COST: Record<ItemType, number> = {
  preventFail: 500,
  preventBurst: 700,
  makeLevel7: 1500,
  makeLevel10: 2500,
  makeLevel12: 4000,
};

const LEVEL_TARGET: Partial<Record<ItemType, number>> = {
  makeLevel7: 7,
  makeLevel10: 10,
  makeLevel12: 12,
};

export const reinforcementHandler: RequestHandler = async (req, res) => {
  const user = await userModel.findById(req.userOid);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const miniGameData = await miniGameModel.findOne({ userId: user._id });
  if (!miniGameData) {
    return res.status(404).json({ error: "MiniGame data not found" });
  }

  const eventStatus = await eventStatusModel.findOne({ userId: user._id });
  if (!eventStatus) {
    return res.status(404).json({ error: "EventStatus data not found" });
  }

  const currentLevel = miniGameData.level;

  // total 20 levels
  if (currentLevel >= 20) {
    return res.status(400).json({
      error: "miniGame/miniGames/reinforcement: Maximum level reached",
    });
  }

  const reinforcementCost = currentLevel * 100;
  if (eventStatus.creditAmount <= reinforcementCost) {
    return res.status(400).json({
      error: "miniGame/miniGames/reinforcement: Insufficient credits",
    });
  }

  const { fail: useFailRaw, burst: useBurstRaw } = req.body as {
    fail?: boolean;
    burst?: boolean;
  };

  const useFail = !!useFailRaw;
  const useBurst = !!useBurstRaw;

  let remainingPreventFail = miniGameData.preventFail;
  let remainingPreventBurst = miniGameData.preventBurst;

  if (useFail) {
    if (remainingPreventFail <= 0) {
      return res.status(400).json({
        error: "miniGame/miniGames/reinforcement: No preventFail item",
      });
    }
    remainingPreventFail -= 1;
  }

  if (useBurst) {
    if (remainingPreventBurst <= 0) {
      return res.status(400).json({
        error: "miniGame/miniGames/reinforcement: No preventBurst item",
      });
    }
    remainingPreventBurst -= 1;
  }

  const probInfo = levelUpProb[currentLevel];

  let { success, maintain, fail, burst } = probInfo;

  if (useFail && useBurst) {
    // 둘 다 사용: 하락 + 파괴 확률 전부 유지로
    maintain += fail + burst;
    fail = 0;
    burst = 0;
  } else if (useFail) {
    // 하락 방지만: fail → maintain
    maintain += fail;
    fail = 0;
  } else if (useBurst) {
    // 파괴 방지만: burst → fail
    maintain += burst;
    burst = 0;
  }

  const rand = Math.floor(Math.random() * 100) + 1;

  let newLevel = currentLevel;
  let levelUpMessage = "";
  if (rand <= success) {
    newLevel = currentLevel + 1;
    levelUpMessage = "강화 성공!";
  } else if (rand <= success + maintain) {
    newLevel = currentLevel;
    levelUpMessage = "강화 유지.";
  } else if (rand <= success + maintain + fail) {
    newLevel = Math.max(1, currentLevel - 1);
    levelUpMessage = "강화 실패.";
  } else {
    newLevel = 1;
    levelUpMessage = "-레제-";
  }

  miniGameData.level = newLevel;
  eventStatus.creditAmount -= reinforcementCost;
  miniGameData.preventFail = remainingPreventFail;
  miniGameData.preventBurst = remainingPreventBurst;
  miniGameData.updatedAt = new Date();
  await miniGameData.save();
  await eventStatus.save();

  await transactionModel.create({
    type: "use",
    amount: reinforcementCost,
    userId: user._id,
    comment: "reinforcement",
  });

  return res.status(200).json({
    levelUpMessage,
    level: newLevel,
    creditAmount: eventStatus.creditAmount,
  });
};

export const getMiniGameInfosHandler: RequestHandler = async (req, res) => {
  try {
    const userId = isLogin(req) ? getLoginInfo(req).oid : null;
    const miniGameStatus = await miniGameModel
      .findOne({ userId })
      .select("level creditAmount preventFail preventBurst")
      .lean();
    const eventStatus = await eventStatusModel.findOne({ userId }).lean();
    if (!miniGameStatus) {
      const newMiniGameStatus = new miniGameModel({
        userId: req.userOid,
        level: 0,
        preventFail: 0,
        preventBurst: 0,
        updatedAt: new Date(),
      });
      await newMiniGameStatus.save();

      return res.json({
        miniGameStatus: {
          level: 0,
          creditAmount: eventStatus?.creditAmount || 0,
          preventFail: 0,
          preventBurst: 0,
        },
      });
    }
    return res.json({
      miniGameStatus: {
        level: miniGameStatus.level,
        creditAmount: eventStatus?.creditAmount || 0,
        preventFail: miniGameStatus.preventFail,
        preventBurst: miniGameStatus.preventBurst,
      },
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "miniGames/ : internal server error" });
  }
};

export const updateCreditHandler: RequestHandler = async (req, res) => {
  try {
    const { score } = req.body;
    const creditAmount = score / 10;
    if (typeof creditAmount !== "number" || creditAmount < 0) {
      return res.status(400).json({ error: "Invalid credit amount" });
    }

    const currentMiniGame = await miniGameModel.findOne({
      userId: req.userOid,
    });
    if (!currentMiniGame) {
      return res.status(404).json({ error: "MiniGame data not found" });
    }

    const maxScore = Math.max(currentMiniGame.dodgeScore, score);

    const updatedMiniGame = await miniGameModel
      .findOneAndUpdate(
        { userId: req.userOid },
        {
          dodgeScore: maxScore,
          updatedAt: new Date(),
        },
        { new: true }
      )
      .lean();

    const timestamp = req.timestamp ? req.timestamp : Date.now();
    if (
      !eventPeriod ||
      timestamp >= eventPeriod.endAt ||
      timestamp < eventPeriod.startAt
    ) {
      minigameReward(Math.min(500, score * 0.1), req.userOid, "dodgePoop");
    }

    return res.json({ updatedMiniGame });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "miniGames/update : internal server error" });
  }
};

export const getMiniGameLeaderboardHandler: RequestHandler = async (
  req,
  res
) => {
  try {
    const userId = req.userOid;

    const leaderboard = await miniGameModel
      .find({ userId: { $ne: null } })
      .select("userId level")
      .sort({ level: -1, updatedAt: 1 })
      .limit(20)
      .lean();

    const userRecord = await miniGameModel
      .findOne({ userId })
      .select("userId level")
      .lean();

    if (!userRecord) {
      return res.json({ leaderboard, userIncluded: false });
    }

    const isInTop20 = leaderboard.some(
      (item) => item.userId?.toString() === userId!.toString()
    );

    let finalLeaderboard = leaderboard;
    if (!isInTop20) {
      finalLeaderboard = [...leaderboard, userRecord];
    }

    const userIds = [
      ...new Set(finalLeaderboard.map((item) => item.userId?.toString())),
    ];

    const users = await userModel
      .find({ _id: { $in: userIds } })
      .select("nickname")
      .lean();

    const nicknameMap = new Map(
      users.map((u) => [u._id.toString(), u.nickname])
    );
    const profileImageUrlMap = new Map(
      users.map((u) => [u._id.toString(), u.profileImageUrl])
    );

    const leaderboardWithNicknamesAndProfileImages = finalLeaderboard.map(
      (item) => ({
        ...item,
        nickname: nicknameMap.get(item.userId.toString()) ?? "Unknown",
        profileImageUrl:
          profileImageUrlMap.get(item.userId.toString()) ??
          "defaultProfileImageUrl",
      })
    );

    return res.json({
      leaderboard: leaderboardWithNicknamesAndProfileImages,
      userIncludedInTop20: isInTop20,
    });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "miniGames/leaderboard : internal server error" });
  }
};

export const getDodgeMiniGameLeaderboardHandler: RequestHandler = async (
  req,
  res
) => {
  try {
    const userId = req.userOid;

    const leaderboard = await miniGameModel
      .find({ userId: { $ne: null } })
      .select("userId dodgeScore")
      .sort({ dodgeScore: -1, updatedAt: 1 })
      .limit(5)
      .lean();

    const userRecord = await miniGameModel
      .findOne({ userId })
      .select("userId dodgeScore")
      .lean();

    if (!userRecord) {
      return res.json({ leaderboard, userIncluded: false });
    }

    const isInTop5 = leaderboard.some(
      (item) => item.userId?.toString() === userId!.toString()
    );

    let finalLeaderboard = leaderboard;
    if (!isInTop5) {
      finalLeaderboard = [...leaderboard, userRecord];
    }

    const userIds = [
      ...new Set(finalLeaderboard.map((item) => item.userId?.toString())),
    ];

    const users = await userModel
      .find({ _id: { $in: userIds } })
      .select("nickname profileImageUrl")
      .lean();

    const nicknameMap = new Map(
      users.map((u) => [u._id.toString(), u.nickname])
    );
    const profileImageUrlMap = new Map(
      users.map((u) => [u._id.toString(), u.profileImageUrl])
    );

    const leaderboardWithNicknamesAndProfileImages = finalLeaderboard.map(
      (item) => ({
        ...item,
        nickname: nicknameMap.get(item.userId.toString()) ?? "Unknown",
        profileImageUrl:
          profileImageUrlMap.get(item.userId.toString()) ??
          "defaultProfileImageUrl",
      })
    );

    return res.json({
      leaderboard: leaderboardWithNicknamesAndProfileImages,
      userIncludedInTop5: isInTop5,
    });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "miniGames/dodgeLeaderboard : internal server error" });
  }
};

export const buyItemHandler: RequestHandler = async (req, res) => {
  try {
    const userId = req.userOid;
    const { itemType } = req.body as { itemType: ItemType };

    // itemType 검증
    if (!itemType || !(itemType in ITEM_COST)) {
      return res.status(400).json({ error: "Invalid item type" });
    }

    const miniGameData = await miniGameModel.findOne({ userId });
    if (!miniGameData) {
      return res.status(404).json({ error: "MiniGame data not found" });
    }

    const eventStatus = await eventStatusModel.findOne({ userId });
    if (!eventStatus) {
      return res.status(404).json({ error: "eventStatus not found" });
    }

    const itemCost = ITEM_COST[itemType];

    if (eventStatus.creditAmount < itemCost) {
      return res.status(400).json({
        error: "miniGame/miniGames/buy: Insufficient credits",
      });
    }

    // 인벤토리형 아이템
    if (itemType === "preventFail") {
      miniGameData.preventFail += 1;
    } else if (itemType === "preventBurst") {
      miniGameData.preventBurst += 1;
    }
    // 즉발 레벨업 아이템
    else if (itemType in LEVEL_TARGET) {
      const targetLevel = LEVEL_TARGET[itemType]!;
      if (miniGameData.level >= targetLevel) {
        return res.status(400).json({
          error: "miniGame/miniGames/buy: Level already high enough",
        });
      }
      miniGameData.level = targetLevel;
    }

    eventStatus.creditAmount -= itemCost;
    miniGameData.updatedAt = new Date();
    await miniGameData.save();
    await eventStatus.save();

    await transactionModel.create({
      type: "use",
      amount: itemCost,
      userId: userId,
      comment: "reinforcement item buy",
    });

    return res.status(200).json({
      level: miniGameData.level,
      preventFail: miniGameData.preventFail,
      preventBurst: miniGameData.preventBurst,
      creditAmount: eventStatus.creditAmount,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "miniGames/buy : internal server error" });
  }
};
