const { transactionModel } = require("../modules/stores/mongo");
const logger = require("../../modules/logger");
const {
  transactionPopulateOption,
} = require("../modules/populates/transactions");

const test = (req, res) => {
  console.log("test");
  res.status(200).json({ msg: "success" });
};

const getRecentTransaction = async (req, res) => {
  try {
    const transactions = await transactionModel
      .find({ type: "use" })
      .sort({ doneat: -1 })
      .limit(5)
      .populate(transactionPopulateOption)
      .lean();
    let transactionListString = [];
    if (transactions) {
      transactions.forEach((item, index) => {
        let purchaceMessage = "";

        console.log(item, index);

        if (item.comment.includes("구매")) {
          purchaceMessage = "구입하셨습니다.";
        } else if (item.comment.includes("획득")) {
          purchaceMessage = "뽑았습니다.";
        } else {
          purchaceMessage = "획득하셨습니다.";
        }
        transactionListString[index] = `${item.userId
          .toString()
          .slice(0, 2)}${"*".repeat(item.userId.length - 2)}"님께서 "${
          item.item
        }"을(를) " ${purchaceMessage}`;
        console.log(transactionListString[index]);
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
  test,
  getRecentTransaction,
};
