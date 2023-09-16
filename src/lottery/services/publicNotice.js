const { eventStatusModel } = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const logger = require("../../modules/logger");
const { isLogin, getLoginInfo } = require("../../modules/auths/login");

const login = (req) => {
  if (isLogin(req)) {
    const { oid } = getLoginInfo(req);
    return oid;
  } else return null;
};

const getTicketLeaderboardHandler = async (req, res) => {
  try {
    const users = await eventStatusModel
      .find(
        {
          $or: [
            {
              ticket1Amount: {
                $gt: 0,
              },
            },
            {
              ticket2Amount: {
                $gt: 0,
              },
            },
          ],
        },
        "userId ticket1Amount ticket2Amount"
      )
      .lean();
    const sortedUsers = users
      .map((user) => ({
        userId: user.userId.toString(),
        weight: user.ticket1Amount + 5 * user.ticket2Amount,
      }))
      .sort((a, b) => -(a.weight - b.weight));

    let rank = -1;
    const userId = login(req);
    const weightSum = sortedUsers.reduce((before, user, index) => {
      if (user.userId === userId) {
        rank = index;
      }
      return before + user.weight;
    }, 0);

    const leaderboard = await Promise.all(
      sortedUsers.slice(0, 20).map(async (user) => {
        const userInfo = await userModel.findOne({ _id: user.userId }).lean();
        return {
          nickname: userInfo?.nickname,
          probability: user.weight / weightSum,
        };
      })
    );

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
  getTicketLeaderboardHandler,
};
