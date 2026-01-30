import type { RequestHandler } from "express";
import { userModel } from "@/modules/stores/mongo";
import { mileageModel } from "../modules/mongo";
import { updateOldPendingTransaction } from "./transaction";
import logger from "@/modules/logger";

const getMileage = async (userId: string) => {
  const transactions = await mileageModel
    .find({
      _id: userId,
      withdraw: false,
    })
    .select({ amount: 1, expireAt: 1 })
    .lean();
  const now = new Date();

  const { expired, active } = transactions.reduce(
    (acc, transaction) => {
      if (transaction.expireAt <= now) {
        acc.expired += transaction.amount;
      } else {
        acc.active += transaction.amount;
      }
      return acc;
    },
    { expired: 0, active: 0 }
  );

  const totalMileage = expired + active;
  const activeMileage = active;

  return {
    totalMileage,
    activeMileage,
  };
};

export const summaryHandler: RequestHandler = async (req, res) => {
  const user = await userModel.findOne({
    _id: req.userOid,
    withdraw: false,
  });
  /** User가 존재하지 않으면 오류를 리턴 */
  if (!user) {
    return res.status(400).json({
      error: "Mileage/summary: User not found",
    });
  }

  await updateOldPendingTransaction(user._id);

  const { totalMileage, activeMileage } = await getMileage(user._id.toString());

  const tier = getTier(activeMileage);

  return res.json({
    totalMileage,
    activeMileage,
    tier,
  });
};

const getTier = (activeMileage: number) => {
  if (activeMileage > 96000) return "gold";
  else if (activeMileage > 24000) return "silver";
  else if (activeMileage > 8000) return "normal";
  else return "none";
};

export const isBadgeAvailable = async (
  userId: string | undefined,
  badgeName: string
) => {
  if (!["none", "normal", "silver", "gold"].includes(badgeName)) {
    return false;
  }
  if (!userId) {
    return false;
  }
  const user = await userModel.findOne({
    _id: userId,
    withdraw: false,
  });

  if (!user) {
    return false;
  }

  if (badgeName == "none") {
    return true;
  }

  const { totalMileage, activeMileage } = await getMileage(user._id.toString());
  const tier = getTier(activeMileage);

  if (badgeName == "normal") {
    return tier == "none" ? false : true;
  } else if (badgeName == "silver") {
    return ["none", "normal"].includes(badgeName) ? false : true;
  } else if (badgeName == "gold") {
    return tier == "gold" ? true : false;
  }
  return false;
};
