const { transactionModel } = require("../modules/stores/mongo");
const { eventStatusModel } = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const { isLogin, getLoginInfo } = require("../../modules/auths/login");
const logger = require("../../modules/logger");
const {
  publicNoticePopulateOption,
} = require("../modules/populates/transactions");

/**
 * getValueRank 사용자의 상품 구매 내역 또는 경품 추첨 내역의 순위 결정을 위한 가치를 평가하는 함수
 * 상품 가격이 높을수록, 상품 구매 일시가 최근일 수록 가치가 높습니다.
 * 요청이 들어온 시간과 트랜젝션이 있었던 시간의 차를 로그스케일로 변환후 이를 가격에 곱하여 가치를 구합니다.
 * 시간의 단위는 millisecond입니다.
 * t_1/2(반감기, half-life)는 4일입니다 .
 * (2일 = 2 * 24 * 60 * 60 * 1000 = 172800000ms)
 * Tau는 반감기를 결정하는 상수입니다.
 * Tau = t_1/2 / ln(2) 로 구할 수 있습니다.
 * Tau = 249297703
 * N_0(초기값)는 item.price를 사용합니다.
 * @param {Object} item
 * @param {number|Date} createAt
 * @param {number|Date} timestamp
 * @returns {Promise}
 * @description 가치를 기준으로 정렬하기 위해 사용됨
 */
const getValueRank = (item, createAt, timestamp) => {
  const t = timestamp - new Date(createAt).getTime(); // millisecond
  const Tau = 249297703;
  return item.price * Math.exp(-t / Tau);
};

const getRecentPurchaceItemListHandler = async (req, res) => {
  try {
    const transactions = (
      await transactionModel
        .find({ type: "use", itemType: 0 })
        .sort({ createAt: -1 })
        .limit(1000)
        .populate(publicNoticePopulateOption)
        .lean()
    )
      .sort(
        (x, y) =>
          getValueRank(y.item, y.createAt, req.timestamp) -
          getValueRank(x.item, x.createAt, req.timestamp)
      )
      .slice(0, 5)
      .map(({ userId, item, comment, createAt }) => ({
        text: `${userId.nickname}님께서 ${item.name}${
          comment.startsWith("송편")
            ? "을(를) 구입하셨습니다."
            : comment.startsWith("랜덤박스")
            ? "을(를) 뽑았습니다."
            : "을(를) 획득하셨습니다."
        }`,
        createAt,
      }));
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

    let weightSum = 0;
    let totalTicket1Amount = 0;
    let totalTicket2Amount = 0;
    for (const user of sortedUsers) {
      weightSum += user.weight;
      totalTicket1Amount += user.ticket1Amount;
      totalTicket2Amount += user.ticket2Amount;

      if (rank < 0 && user.userId === userId) {
        rank = index;
      }
    }

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
        totalTicket1Amount,
        totalTicket2Amount,
        totalUserAmount: users.length,
        rank: rank + 1,
        probability: sortedUsers[rank].weight / weightSum,
        probabilityV2: calculateProbabilityV2(
          users,
          weightSum,
          base,
          sortedUsers[rank].weight
        ),
      });
    else
      res.json({
        leaderboard,
        totalTicket1Amount,
        totalTicket2Amount,
        totalUserAmount: users.length,
      });
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
