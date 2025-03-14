import type { Request, Response } from "express";
import { transactionModel } from "../modules/stores/mongo";
import { transactionPopulateOption } from "../modules/populates/transactions";
import logger from "@/modules/logger";
import type { Transaction } from "../types";

const formatTransaction = (transaction: Transaction): Transaction => {
  if (transaction.itemId) {
    transaction.item = transaction.itemId;
    delete transaction.itemId;
  }
  return transaction;
};

const getUserTransactionsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactions = await transactionModel
      .find(
        { userId: req.userOid },
        "type amount questId itemId comment createdAt"
      )
      .populate(transactionPopulateOption)
      .lean();
    if (!transactions) {
      res.status(500).json({ error: "Transactions/ : internal server error" });
      return;
    }

    res.json({
      transactions: transactions.map(formatTransaction),
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Transactions/ : internal server error" });
  }
};

export default getUserTransactionsHandler;
