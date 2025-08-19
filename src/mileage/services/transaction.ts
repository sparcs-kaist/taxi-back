import logger from "@/modules/logger";
import type { RequestHandler } from "express";
import { mileageModel, userModel } from "@/modules/stores/mongo";
import {
  TransactionCreateBody,
  TransactionViewQuery,
} from "../routes/docs/schemas/mileageSchema";

export const transactionCreateHandler: RequestHandler = async (req, res) => {
  const { type, amount } = req.body as TransactionCreateBody;

  /** amount가 음수면 오류를 반환 */
  if (amount <= 0) {
    return res.status(400).json({
      error: "Mileage: Negative amount",
    });
  }

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

  const now = new Date();

  let expireDate = new Date();
  expireDate.setFullYear(expireDate.getFullYear() + 1);

  try {
    let transaction = new mileageModel({
      user: user._id,
      type: type,
      amount: amount,
      createAt: now,
      expireAt: expireDate,
    });

    await transaction.save();
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Mileage: internal server error",
    });
  }
};

export const transactionViewHandler: RequestHandler = async (req, res) => {
  const { type, page } = req.query as unknown as TransactionViewQuery;

  if (page <= 0) {
    return res.status(400).json({
      error: "Mileage: page should be positive integer",
    });
  }

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

  try {
    const rows = await mileageModel
      .find({
        user: req.userOid,
        type: type,
      })
      .sort({ createAt: -1, _id: -1 })
      .skip((page - 1) * 20)
      .limit(20)
      .lean();

    const result = rows.map((item) => ({
      amount: item.amount,
      type: item.type,
      createAt: item.createAt,
      expireAt: item.expireAt,
    }));

    return result;
  } catch (err) {
    return res.status(500).json({
      error: "Mileage: internal server error",
    });
  }
};
