import type { RequestHandler } from "express";
import { mileageModel, userModel } from "@/modules/stores/mongo";

export const summaryHandler: RequestHandler = async (req, res) => {
  const user = await userModel.findOne({
    _id: req.userOid,
    withdraw: false,
    ban: false,
  });
  /** User가 존재하지 않으면 오류를 리턴 */
  if (!user) {
    return res.status(400).json({
      error: "Mileage: User not found",
    });
  }

  const transactions = await mileageModel
    .find({
      user: user._id,
    })
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

  const tier = getTier(totalMileage, activeMileage);

  return res.json({
    totalMileage,
    activeMileage,
    tier,
  });
};

const getTier = (totalMileage: number, activeMileage: number) => {
  if (totalMileage > 100) {
    return "넙죽";
  }
  if (totalMileage > 32 && activeMileage > 10) {
    return "Diamond";
  }
  if (totalMileage > 16 && activeMileage > 6) {
    return "Platinum";
  }
  if (totalMileage > 8 && activeMileage > 3) {
    return "Gold";
  }
  if (totalMileage > 4 && activeMileage > 1) {
    return "Silver";
  }
  return "Bronze";
};
