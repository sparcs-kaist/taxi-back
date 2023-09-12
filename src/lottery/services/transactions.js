const { transactionModel } = require("../modules/stores/mongo");
const logger = require("../../modules/logger");
const {
  transactionPopulateOption,
} = require("../modules/populates/transactions");

const getUserTransactionsHandler = async (req, res) => {
  try {
    const transactions = await transactionModel
      .find({ userId: req.userOid }, "-userId -__v")
      .populate(transactionPopulateOption);
    if (transactions)
      res.json({
        transactions,
      }); // userId는 이미 Frontend에서 알고 있고, 중복되는 값이므로 제외합니다.
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
