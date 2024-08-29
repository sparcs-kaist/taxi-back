const { transactionModel } = require("../modules/stores/mongo");
const {
  transactionPopulateOption,
} = require("../modules/populates/transactions");
const logger = require("../../modules/logger");

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
    if (transactions)
      res.json({
        transactions: transactions.map(formatTransaction),
      });
    else
      res.status(500).json({ error: "Transactions/ : internal server error" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Transactions/ : internal server error" });
  }
};

module.exports = {
  getUserTransactionsHandler,
};
