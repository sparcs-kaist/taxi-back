const { transactionModel } = require("../modules/stores/mongo");
const logger = require("../../modules/logger");
const {
  transactionPopulateOption,
} = require("../modules/populates/transactions");

const getUserTransactionsHandler = async (req, res) => {
  try {
    // userId는 이미 Frontend에서 알고 있고, 중복되는 값이므로 제외합니다.
    const transactions = await transactionModel
      .find({ userId: req.userOid }, "-userId -itemType -__v")
      .populate(transactionPopulateOption)
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
