const {
  eventStatusModel,
  itemModel,
  transactionModel,
} = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const { isLogin, getLoginInfo } = require("../../modules/auths/login");
const logger = require("../../modules/logger");

const { eventConfig } = require("../../../loadenv");

const getItemsHandler = async (req, res) => {
  try {
    const items = await itemModel
      .find(
        {},
        "_id name description imageUrl instagramStoryStickerImageUrl price isDisabled itemType"
      )
      .lean();
    res.json({ items });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Items/ : internal server error" });
  }
};

// 유도 과정은 services/publicNotice.js 파일에 정의된 calculateProbabilityV2 함수의 주석 참조
const calculateWinProbability = (stock, users, amount, totalAmount) => {
  if (users.length <= stock) return 1;

  const base = Math.pow(1 - stock / users.length, users.length / totalAmount);
  return 1 - Math.pow(base, amount);
};

const getItemLeaderboardHandler = async (req, res) => {
  try {
    // 상품 정보를 가져옵니다.
    const { itemId } = req.params;
    const item = await itemModel.findOne({ _id: itemId, itemType: 0 }).lean();
    if (!item)
      return res
        .status(400)
        .json({ error: "Items/leaderboard : invalid item" });

    // 해당 상품을 구매한 유저들의 목록을 가져옵니다.
    const users = await transactionModel.aggregate([
      {
        $match: {
          type: "use",
          itemId: item._id,
        },
      },
      {
        $group: {
          _id: "$userId",
          amount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: eventStatusModel.collection.name,
          localField: "_id",
          foreignField: "userId",
          as: "eventStatus",
        },
      },
      {
        $match: {
          "eventStatus.0.isBanned": false,
        },
      },
      {
        $sort: { amount: -1 },
      },
    ]);

    // 리더보드 생성을 위해 필요한 정보를 계산합니다.
    const totalAmount = users.reduce((acc, user) => acc + user.amount, 0);
    const rankMap = new Map(
      users
        .map((user) => user.amount)
        .reduce((acc, amount, index) => {
          if (acc.length === 0 || acc[acc.length - 1][0] !== amount) {
            acc.push([amount, index + 1]);
          }
          return acc;
        }, [])
    );

    // 리더보드를 생성합니다.
    const leaderboardBase = users.map((user) => ({
      userId: user._id,
      amount: user.amount,
      probability: calculateWinProbability(
        item.stock,
        users,
        user.amount,
        totalAmount
      ),
      rank: rankMap.get(user.amount),
    }));
    const leaderboard = await Promise.all(
      leaderboardBase
        .filter((user) => user.rank <= 20)
        .map(async (user) => {
          const userInfo = await userModel.findById(user.userId).lean();
          return {
            nickname: userInfo.nickname,
            profileImageUrl: userInfo.profileImageUrl,
            amount: user.amount,
            probability: user.probability,
          };
        })
    );

    const userId = isLogin(req) ? getLoginInfo(req).oid : null;
    const user = leaderboardBase.find(
      (user) => user.userId.toString() === userId
    );

    return res.json({
      leaderboard,
      amount: user?.amount,
      probability: user?.probability,
      rank: user?.rank,
    });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "Items/leaderboard : internal server error" });
  }
};

const updateEventStatus = async (
  userId,
  { creditDelta = 0, ticket1Delta = 0, ticket2Delta = 0 } = {}
) =>
  await eventStatusModel.updateOne(
    { userId },
    {
      $inc: {
        creditAmount: creditDelta,
        ticket1Amount: ticket1Delta,
        ticket2Amount: ticket2Delta,
      },
    }
  );

const hideItemStock = (item) => {
  item.stock = item.stock > 0 ? 1 : 0;
  return item;
};

const getRandomItem = async (req, depth) => {
  if (depth >= 10) {
    logger.error(`User ${req.userOid} failed to open random box`);
    return null;
  }

  const items = await itemModel
    .find({
      isRandomItem: true,
      stock: { $gt: 0 },
      isDisabled: false,
    })
    .lean();
  const randomItems = items
    .map((item) => Array(item.randomWeight).fill(item))
    .reduce((a, b) => a.concat(b), []);
  const dumpRandomItems = randomItems
    .map((item) => item._id.toString())
    .join(",");

  logger.info(
    `User ${req.userOid}'s ${
      depth + 1
    }th random box probability is: [${dumpRandomItems}]`
  );

  if (randomItems.length === 0) return null;

  const randomItem =
    randomItems[Math.floor(Math.random() * randomItems.length)];
  try {
    // 1단계: 재고를 차감합니다.
    const newRandomItem = await itemModel
      .findOneAndUpdate(
        { _id: randomItem._id, stock: { $gt: 0 } },
        {
          $inc: {
            stock: -1,
          },
        },
        {
          new: true,
          fields: {
            itemType: 0,
            isRandomItem: 0,
            randomWeight: 0,
          },
        }
      )
      .lean();
    if (!newRandomItem) {
      throw new Error(`Item ${randomItem._id.toString()} was already sold out`);
    }

    // 2단계: 유저 정보를 업데이트합니다.
    await updateEventStatus(req.userOid, {
      ticket1Delta: randomItem.itemType === 1 ? 1 : 0,
      ticket2Delta: randomItem.itemType === 2 ? 1 : 0,
    });

    // 3단계: Transaction을 추가합니다.
    const transaction = new transactionModel({
      type: "use",
      amount: 0,
      userId: req.userOid,
      itemId: randomItem._id,
      comment: `랜덤박스에서 "${randomItem.name}" 1개를 획득했습니다.`,
    });
    await transaction.save();

    return newRandomItem;
  } catch (err) {
    logger.error(err);
    logger.warn(
      `User ${req.userOid}'s ${depth + 1}th random box failed due to exception`
    );

    return await getRandomItem(req, depth + 1);
  }
};

const purchaseItemHandler = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await itemModel.findOne({ _id: itemId }).lean();
    if (!item)
      return res.status(400).json({ error: "Items/Purchase : invalid Item" });

    // 구매 가능 조건: 크레딧이 충분하며, 재고가 남아있으며, 판매 중인 아이템이어야 합니다.
    if (item.isDisabled)
      return res.status(400).json({ error: "Items/Purchase : disabled item" });
    if (req.eventStatus.creditAmount < item.price)
      return res
        .status(400)
        .json({ error: "Items/Purchase : not enough credit" });
    if (item.stock <= 0)
      return res
        .status(400)
        .json({ error: "Items/Purchase : item out of stock" });

    // 1단계: 재고를 차감합니다.
    const { modifiedCount } = await itemModel.updateOne(
      { _id: item._id, stock: { $gt: 0 } },
      {
        $inc: {
          stock: -1,
        },
      }
    );
    if (modifiedCount === 0)
      return res
        .status(400)
        .json({ error: "Items/Purchase : item out of stock" });

    // 2단계: 유저 정보를 업데이트합니다.
    await updateEventStatus(req.userOid, {
      creditDelta: -item.price,
      ticket1Delta: item.itemType === 1 ? 1 : 0,
      ticket2Delta: item.itemType === 2 ? 1 : 0,
    });

    // 3단계: Transaction을 추가합니다.
    const transaction = new transactionModel({
      type: "use",
      amount: item.price,
      userId: req.userOid,
      itemId: item._id,
      comment: `${eventConfig?.credit.name} ${item.price}개를 사용해 "${item.name}" 1개를 획득했습니다.`,
    });
    await transaction.save();

    // 4단계: 랜덤박스인 경우 아이템을 추첨합니다.
    if (item.itemType !== 3) return res.json({ result: true });

    const randomItem = await getRandomItem(req, 0);
    if (!randomItem) {
      // 랜덤박스가 실패한 경우, 상태를 구매 이전으로 되돌립니다.
      // TODO: Transactions 도입 후 이 코드는 삭제합니다.
      logger.info(`User ${req.userOid}'s status will be restored`);

      await transactionModel.deleteOne({ _id: transaction._id });
      await updateEventStatus(req.userOid, {
        creditDelta: item.price,
      });
      await itemModel.updateOne(
        { _id: item._id },
        {
          $inc: {
            stock: 1,
          },
        }
      );

      logger.info(`User ${req.userOid}'s status was successfully restored`);

      return res
        .status(500)
        .json({ error: "Items/Purchase : random box error" });
    }

    res.json({
      result: true,
      reward: hideItemStock(randomItem),
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Items/Purchase : internal server error" });
  }
};

module.exports = {
  getItemsHandler,
  getItemLeaderboardHandler,
  purchaseItemHandler,
};
