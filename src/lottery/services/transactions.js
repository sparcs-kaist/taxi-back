const { transactionModel } = require("../modules/stores/mongo");
const logger = require("../../modules/logger");

const hideItemStock = (transaction) => {
  if (transaction.item) {
    transaction.item.stock = transaction.item.stock > 0 ? 1 : 0;
  }
  return transaction;
};

const getUserTransactionsHandler = async (req, res) => {
  try {
    // userId는 이미 Frontend에서 알고 있고, 중복되는 값이므로 제외합니다.
    const transactions = await transactionModel
      .find({ userId: req.userOid }, "_id type amount questId comment createAt")
      .lean();
    if (transactions)
      res.json({
        transactions,
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
