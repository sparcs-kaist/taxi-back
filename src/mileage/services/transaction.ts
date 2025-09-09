import logger from "@/modules/logger";
import type { RequestHandler } from "express";
import { mileageModel, userModel } from "@/modules/stores/mongo";
import { TransactionViewQuery } from "../routes/docs/schemas/mileageSchema";
import { Types } from "mongoose";

type MileageTransactionCreateObject = {
  userId: Types.ObjectId;
  time?: Date;
  type: string;
  source: Types.ObjectId;
  amount: number;
};

type MileageTransactionUpdateObject = {
  userId: Types.ObjectId;
  source: Types.ObjectId | string;
  status?: "pending" | "confirmed" | "voided";
  amount?: number;
};

const toSourceString = (src: Types.ObjectId | string) => {
  return typeof src === "string" ? src : src.toString();
};

export const createTransaction = async (
  input: MileageTransactionCreateObject
) => {
  const { userId, type, source, amount } = input;
  const time = input.time ? input.time : new Date();

  let expireDate = new Date(time);
  expireDate.setUTCFullYear(expireDate.getUTCFullYear() + 1);

  try {
    let transaction = new mileageModel({
      user: userId,
      type: type,
      source: toSourceString(source),
      amount: amount,
      status: "pending",
      createAt: time,
      expireAt: expireDate,
    });

    await transaction.save();

    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
};

export const updateTransaction = async (
  input: MileageTransactionUpdateObject[]
) => {
  if (!Array.isArray(input) || input.length === 0) {
    return { matchedCount: 0, modifiedCount: 0 };
  }

  try {
    const bulkOps = input.flatMap((u) => {
      const filter: Record<string, any> = {
        user: u.userId,
        source: toSourceString(u.source),
      };
      const docs: Record<string, any> = {};

      const hasAmount = typeof u.amount === "number";
      const hasStatus = typeof u.status === "string";

      // if we change status, only pending -> confirmed | void is allowed
      // this condition works when they settles payments
      if (hasStatus && u.status !== "pending") {
        filter.status = "pending";
        docs.status = u.status;
        if (hasAmount) {
          docs.amount = u.amount;
        }
      }
      // this condition works when user join or aborts the room.
      else if (hasAmount && !hasStatus) {
        filter.status = "pending";
        docs.amount = u.amount;
      } else {
        return [];
      }

      // if there is nothing to change: skipped
      if (Object.keys(docs).length === 0) {
        return [];
      }

      return [
        {
          updateOne: {
            filter: filter,
            update: { $set: docs },
            upsert: false,
          },
        },
      ];
    });

    // nothing to change: skipped
    if (bulkOps.length === 0) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const result = await mileageModel.bulkWrite(bulkOps, { ordered: false });
    return {
      matchedCount: result.matchedCount ? result.matchedCount : 0,
      modifiedCount: result.modifiedCount ? result.modifiedCount : 0,
    };
  } catch (err) {
    return { matchedCount: 0, modifiedCount: 0, error: true };
  }
};

export const updateOldPendingTransaction = async (userId?: Types.ObjectId) => {
  // 오래된 pending status의 transaction을 confirmed로 수정합니다.
  // 해당 경우는 택시를 이용하였으나 정산은 앱 외부에서 한 경우에 해당됩니다.
  const criterion = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // ride에서 발생한 transaction만 수정합니다.
  const filter: Record<string, any> = {
    type: "ride",
    status: "pending",
    createAt: { $lte: criterion },
  };
  if (userId) {
    filter.user = userId;
  }

  try {
    const result = await mileageModel.updateMany(filter, {
      $set: { status: "confirmed" },
    });

    const matchedCount = (result as any).matchedCount ?? 0;
    const modifiedCount = (result as any).modifiedCount ?? 0;

    return { matchedCount, modifiedCount };
  } catch (err) {
    logger.error(err);
    return { matchedCount: 0, modifiedCount: 0, error: true };
  }
};

export const transactionViewHandler: RequestHandler = async (req, res) => {
  const { type, page } = req.query as unknown as TransactionViewQuery;
  const pageNum = Number(page) || 1;

  if (!Number.isInteger(pageNum) || pageNum <= 0) {
    return res.status(400).json({
      error: "Mileage/transaction: page should be positive integer",
    });
  }

  const user = await userModel
    .findOne({
      _id: req.userOid,
      withdraw: false,
    })
    .lean();
  /** User가 존재하지 않으면 오류를 리턴 */
  if (!user) {
    return res.status(400).json({
      error: "Mileage/transaction: User not found",
    });
  }

  try {
    await updateOldPendingTransaction(user._id);
    // confirmed된 transaction들을 조회합니다.
    const findQuery: Record<string, any> = {
      user: req.userOid,
      status: "confirmed",
    };
    if (type) {
      findQuery.type = type;
    }
    const result = await mileageModel
      .find(findQuery)
      .sort({ createAt: -1, _id: -1 })
      .skip((pageNum - 1) * 20)
      .limit(20)
      .select({ amount: 1, type: 1, createAt: 1, expireAt: 1, _id: 0 })
      .lean();

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      error: "Mileage/transaction: internal server error",
    });
  }
};
