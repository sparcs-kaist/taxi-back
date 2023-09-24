const { transactionModel } = require("../modules/stores/mongo");
const { eventStatusModel } = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const { isLogin, getLoginInfo } = require("../../modules/auths/login");
const logger = require("../../modules/logger");
const {
  publicNoticePopulateOption,
} = require("../modules/populates/transactions");

const getRecentPurchaceItemListHandler = async (req, res) => {
  try {
    const transactions = (
      await transactionModel
        .find({ type: "use", itemType: 0 })
        .sort({ createAt: -1 })
        .limit(5)
        .populate(publicNoticePopulateOption)
        .lean()
    ).map(
      ({ userId, item, comment }) =>
        `${userId.nickname}님께서 ${item.name}을(를) ${
          comment.startsWith("송편")
            ? "을(를) 구입하셨습니다."
            : comment.startsWith("랜덤박스")
            ? "을(를) 뽑았습니다."
            : "을(를) 획득하셨습니다."
        }`
    );
    res.json({ transactions });
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "PublicNotice/RecentTransactions : internal server error",
    });
  }
};

const calculateProbabilityV2 = (users, weightSum, base, weight) => {
  // 유저 수가 상품 수보다 적거나 같으면 무조건 상품을 받게된다.
  if (users.length <= 15) return 1;

  /**
   * 경험적으로 발견한 사실
   *
   * p를 에어팟 당첨 확률, M을 전체 티켓 수라고 하자.
   * 모든 유저의 p값이 1/15 미만일 경우, 실제 당첨 확률은 15p이다.
   * 그렇지 않은 경우, 실제 당첨 확률은 1-a^Mp꼴의 지수함수를 따른다. (Note: Mp는 티켓 수이다.)
   *
   * 계산 과정
   *
   * a는 유저 수, 전체 티켓 수, 티켓 분포에 의해 결정되는 값으로, 현실적으로 계산하기 어렵다.
   * 따라서, 모든 유저가 같은 수의 티켓을 가지고 있다고 가정하고 a를 계산한 뒤, 이를 확률 계산에 사용한다.
   *
   * a값의 계산 과정
   *
   * N을 유저 수라고 하자. 모든 유저가 같은 수의 티켓 M/N개를 가지고 있다고 하자.
   * 이때 기대되는 당첨 확률은 직관적으로 15/N임을 알 수 있다. 즉, 1-a^(M/N) = 15/N이다.
   * a에 대해 정리하면, a = (1-15/N)^(N/M)임을 알 수 있다.
   */
  if (base !== null) return 1 - Math.pow(base, weight);
  else return (weight / weightSum) * 15;
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
    const isExponential =
      sortedUsers.find((user) => user.weight >= weightSum / 15) != undefined;
    const base = isExponential
      ? Math.pow(1 - 15 / users.length, users.length / weightSum)
      : null;

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
          probabilityV2: calculateProbabilityV2(
            users,
            weightSum,
            base,
            user.weight
          ),
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
        probabilityV2: calculateProbabilityV2(
          users,
          weightSum,
          base,
          sortedUsers[rank].weight
        ),
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
  getRecentPurchaceItemListHandler,
  getTicketLeaderboardHandler,
};
