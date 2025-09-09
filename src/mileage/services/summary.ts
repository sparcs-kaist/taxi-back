import type { RequestHandler } from "express";
import { mileageModel, userModel } from "@/modules/stores/mongo";
import { updateOldPendingTransaction } from "./transaction";

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

  const transactions = await mileageModel
    .find({
      user: user._id,
      status: "confirmed",
    })
    .select({ amount: 1, expireAt: 1 })
    .lean();

  const now = req.timestamp ? new Date(req.timestamp) : new Date();

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

  const tier = getTier(totalMileage, activeMileage);

  return res.json({
    totalMileage,
    activeMileage,
    tier,
  });
};

const getTier = (totalMileage: number, activeMileage: number) => {
  if (totalMileage > 128000 && activeMileage > 96000) {
    return "gold";
  }
  if (totalMileage > 32000 && activeMileage > 24000) {
    return "silver";
  }
  if (totalMileage > 8000 && activeMileage > 8000) {
    return "normal";
  }
  return "none";
};
