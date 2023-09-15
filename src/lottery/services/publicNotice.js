const { transactionModel } = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const logger = require("../../modules/logger");
const {
  publicNoticePopulateOption,
} = require("../modules/populates/publicNotice");

const getTransactions = async () => {
  try {
    const transactions = await transactionModel
      .find({ type: "use" })
      .sort({ doneat: -1 })
      .limit(5)
      .populate(publicNoticePopulateOption)
      .lean();
    if (transactions) {
      return await getTransactionsCallbackGetUser(transactions);
    } else {
      return undefined;
    }
  } catch (err) {
    return undefined;
  }
};
const getTransactionsCallbackGetUser = async (transactions) => {
  const users = await userModel.find();
  for (let user of users) {
    for (let transaction of transactions) {
      if (user._id.equals(transaction.userId)) {
        transaction.id = user.id;
      }
    }
  }
  return transactions;
};
const getRecentTransaction = async (req, res) => {
  try {
    let transactionListString = [];
    await getTransactions();
    const transactions = await getTransactions();
    if (!!transactions) {
      transactions.forEach((item, index) => {
        let purchaceMessage = "";
        if (item.comment.includes("구매")) {
          purchaceMessage = "구입하셨습니다.";
        } else if (item.comment.includes("획득")) {
          purchaceMessage = "뽑았습니다.";
        } else {
          purchaceMessage = "획득하셨습니다.";
        }
        transactionListString[index] = `${item.id
          .toString()
          .slice(0, 2)}${"*".repeat(item.id.length - 2)}님께서 ${
          item.item.name
        }을(를) ${purchaceMessage}`;
      });
      console.log(transactionListString);
      res.json({
        transactionListString,
      });
    } else {
      res.status(500).json({
        error: "PublicNotice/get-recent-transaction : internal server error",
      });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "PublicNotice/get-recent-transaction : internal server error",
    });
  }
};

module.exports = {
  getRecentTransaction,
};
