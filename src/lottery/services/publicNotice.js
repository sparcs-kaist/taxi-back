const { transactionModel } = require("../modules/stores/mongo");
const { eventStatusModel } = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const { isLogin, getLoginInfo } = require("../../modules/auths/login");
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

const getTicketLeaderboardHandler = async (req, res) => {
  try {
    const users = await eventStatusModel
      .find({
        $or: [{ ticket1Amount: { $gt: 0 } }, { ticket2Amount: { $gt: 0 } }],
      })
      .lean();
    const sortedUsers = users
      .map((user) => ({
        userId: user.userId.toString(),
        ticket1Amount: user.ticket1Amount,
        ticket2Amount: user.ticket2Amount,
        weight: user.ticket1Amount + 5 * user.ticket2Amount,
      }))
      .sort((a, b) => -(a.weight - b.weight));

    const userId = isLogin(req) ? getLoginInfo(req).oid : null;
    let rank = -1;

    const weightSum = sortedUsers.reduce((before, user, index) => {
      if (rank < 0 && user.userId === userId) {
        rank = index;
      }
      return before + user.weight;
    }, 0);

    const leaderboard = await Promise.all(
      sortedUsers.slice(0, 20).map(async (user) => {
        const userInfo = await userModel.findOne({ _id: user.userId }).lean();
        if (!userInfo) {
          logger.error(`Fail to find user ${user.userId}`);
          return null;
        }

        return {
          nickname: userInfo.nickname,
          profileImageUrl: userInfo.profileImageUrl,
          ticket1Amount: user.ticket1Amount,
          ticket2Amount: user.ticket2Amount,
          probability: user.weight / weightSum,
        };
      })
    );
    if (leaderboard.includes(null))
      return res
        .status(500)
        .json({ error: "PublicNotice/Leaderboard : internal server error" });

    if (rank >= 0)
      res.json({
        leaderboard,
        rank: rank + 1,
        probability: sortedUsers[rank].weight / weightSum,
      });
    else res.json({ leaderboard });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "PublicNotice/Leaderboard : internal server error" });
  }
};

module.exports = {
  getRecentTransaction,
  getTicketLeaderboardHandler,
};
