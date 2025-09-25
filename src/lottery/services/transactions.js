const { transactionModel } = require("../modules/stores/mongo");

const {
  transactionPopulateOption,
} = require("../modules/populates/transactions");
const logger = require("@/modules/logger").default;

const formatTransaction = (transaction) => {
  if (transaction.itemId) {
    transaction.item = transaction.itemId;
    delete transaction.itemId;
  }
  return transaction;
};

const getUserTransactionsHandler = async (req, res) => {
  try {
    const transactions = await transactionModel
      .find(
        { userId: req.userOid },
        "type amount questId itemId comment createdAt"
      )
      .populate(transactionPopulateOption)
      .lean();
    if (!transactions)
      return res
        .status(500)
        .json({ error: "Transactions/ : internal server error" });

    res.json({
      transactions: transactions.map(formatTransaction),
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Transactions/ : internal server error" });
  }
};

module.exports = {
  getUserTransactionsHandler,
};
