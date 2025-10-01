const {
  eventStatusModel,
  itemModel,
  transactionModel,
} = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const { isLogin, getLoginInfo } = require("../../modules/auths/login");
const logger = require("@/modules/logger").default;

const { eventConfig } = require("@/loadenv");
const contracts = require("../modules/contracts");

const getItemsHandler = async (req, res) => {
  try {
    const items = await itemModel
      .find(
        { itemType: { $ne: 4 } },
        "_id name description imageUrl price isDisabled itemType realStock"
      )
      .lean();
    res.json({ items });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Items/ : internal server error" });
  }
};

const getItemHandler = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await itemModel
      .findById(
        itemId,
        "_id name description imageUrl price isDisabled itemType realStock"
      )
      .lean();
    if (!item) return res.status(400).json({ error: "Items/ : invalid item" });

    res.json({ item });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Items/ : internal server error" });
  }
};

// 유도 과정은 services/publicNotice.js 파일에 정의된 calculateProbabilityV2 함수의 주석 참조
const calculateWinProbability = (realStock, users, amount, totalAmount) => {
  if (users.length <= realStock) return 1;

  const base = Math.pow(
    1 - realStock / users.length,
    users.length / totalAmount
  );
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
          amount: { $sum: "$itemAmount" },
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
        item.realStock,
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
          const userInfo = await userModel
            .findOne({ _id: user.userId, withdraw: false })
            .lean();
          if (!userInfo) {
            logger.error(`Fail to find user ${user.userId}`);
            return null;
          }
          return {
            userId: user.userId,
            nickname: userInfo.nickname,
            profileImageUrl: userInfo.profileImageUrl,
            amount: user.amount,
            probability: user.probability,
            rank: user.rank,
          };
        })
    );
    if (leaderboard.includes(null))
      return res
        .status(500)
        .json({ error: "Items/leaderboard : internal server error" });

    const userId = isLogin(req) ? getLoginInfo(req).oid : null;
    const user = leaderboardBase.find(
      (user) => user.userId.toString() === userId
    );

    return res.json({
      leaderboard,
      totalAmount,
      totalUser: users.length,
      amount: user?.amount,
      probability: user?.probability,
      rank: user?.rank,
      userId: user?.userId,
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

// 아래의 함수는 2025 봄 이벤트에서 사용되지 않습니다.
//
// const getRandomItem = async (req, depth) => {
//   if (depth >= 10) {
//     logger.error(`User ${req.userOid} failed to open random box`);
//     return null;
//   }

//   const items = await itemModel
//     .find({
//       isRandomItem: true,
//       stock: { $gt: 0 },
//       isDisabled: false,
//     })
//     .lean();
//   const randomItems = items
//     .map((item) => Array(item.randomWeight).fill(item))
//     .reduce((a, b) => a.concat(b), []);
//   const dumpRandomItems = randomItems
//     .map((item) => item._id.toString())
//     .join(",");

//   logger.info(
//     `User ${req.userOid}'s ${
//       depth + 1
//     }th random box probability is: [${dumpRandomItems}]`
//   );

//   if (randomItems.length === 0) return null;

//   const randomItem =
//     randomItems[Math.floor(Math.random() * randomItems.length)];
//   try {
//     // 1단계: 재고를 차감합니다.
//     const newRandomItem = await itemModel
//       .findOneAndUpdate(
//         { _id: randomItem._id, stock: { $gt: 0 } },
//         {
//           $inc: {
//             stock: -1,
//           },
//         },
//         {
//           new: true,
//           fields: {
//             itemType: 0,
//             isRandomItem: 0,
//             randomWeight: 0,
//           },
//         }
//       )
//       .lean();
//     if (!newRandomItem) {
//       throw new Error(`Item ${randomItem._id.toString()} was already sold out`);
//     }

//     // 2단계: 유저 정보를 업데이트합니다.
//     await updateEventStatus(req.userOid, {
//       ticket1Delta: randomItem.itemType === 1 ? 1 : 0,
//       ticket2Delta: randomItem.itemType === 2 ? 1 : 0,
//     });

//     // 3단계: Transaction을 추가합니다.
//     const transaction = new transactionModel({
//       type: "use",
//       amount: 0,
//       userId: req.userOid,
//       itemId: randomItem._id,
//       comment: `랜덤박스에서 "${randomItem.name}" 1개를 획득했습니다.`,
//     });
//     await transaction.save();

//     return newRandomItem;
//   } catch (err) {
//     logger.error(err);
//     logger.warn(
//       `User ${req.userOid}'s ${depth + 1}th random box failed due to exception`
//     );

//     return await getRandomItem(req, depth + 1);
//   }
// };

const purchaseItem = async (req, item, amount) => {
  const totalPrice = item.price * amount;

  // 구매 가능 조건: 재화가 충분하며, 재고가 남아있으며, 판매 중인 상품이어야 합니다.
  if (item.isDisabled) return { error: "disabled item" };
  if (req.eventStatus.creditAmount < totalPrice)
    return { error: "not enough credit" };
  if (item.stock < amount) return { error: "out of stock" };

  // 1단계: 재고를 차감합니다.
  const { modifiedCount } = await itemModel.updateOne(
    { _id: item._id, stock: { $gte: amount } },
    { $inc: { stock: -amount } }
  );
  if (modifiedCount === 0) return { error: "item out of stock" };

  if (item.itemType === 3) {
    // 랜덤박스를 구입한 경우
    // 2단계: 대박(40%)인지 쪽박(60%)인지 결정합니다.
    const isJackpot = Math.random() < 0.4;
    const creditDelta = isJackpot ? totalPrice : -totalPrice;

    // 3단계: 유저 정보를 업데이트합니다.
    await updateEventStatus(req.userOid, { creditDelta });

    // 4단계: 입출금 내역을 추가합니다.
    if (isJackpot) {
      const transaction = new transactionModel({
        type: "get",
        amount: creditDelta,
        userId: req.userOid,
        itemId: item._id,
        itemAmount: amount,
        comment: `${eventConfig?.credit.name} ${totalPrice}개를 "${item.name}"에 사용해 대박을 터뜨렸습니다.`,
      });
      await transaction.save();
    } else {
      const transaction = new transactionModel({
        type: "use",
        amount: -creditDelta,
        userId: req.userOid,
        itemId: item._id,
        itemAmount: amount,
        comment: `${eventConfig?.credit.name} ${totalPrice}개를 "${item.name}"에 사용했지만 쪽박을 맞았습니다.`,
      });
      await transaction.save();
    }

    return { result: { result: true, isJackpot } };
  } else if (item.itemType === 4) {
    // 쿠폰을 사용한 경우
    // 2단계: 쿠폰 사용 여부를 조회합니다.
    const isUsed = await transactionModel.exists({
      userId: req.userOid,
      itemId: item._id,
    });
    if (isUsed) return { error: "already used coupon" };

    // 3단계: 유저 정보를 업데이트합니다.
    await updateEventStatus(req.userOid, {
      creditDelta: item.couponReward,
    });

    // 4단계: 입출금 내역을 추가합니다.
    const transaction = new transactionModel({
      type: "get",
      amount: item.couponReward,
      userId: req.userOid,
      itemId: item._id,
      itemAmount: amount,
      comment: `쿠폰 "${item.name}"을 사용해 ${eventConfig?.credit.name} ${item.couponReward}개를 획득했습니다.`,
    });
    await transaction.save();

    return { result: { result: true, reward: item.couponReward } };
  } else {
    // 랜덤박스, 쿠폰이 아닌 상품을 구입한 경우
    // 2단계: 유저 정보를 업데이트합니다.
    await updateEventStatus(req.userOid, {
      creditDelta: -totalPrice,
      ticket1Delta: item.itemType === 1 ? amount : 0,
      ticket2Delta: item.itemType === 2 ? amount : 0,
    });

    // 3단계: 출금 내역을 추가합니다.
    const transaction = new transactionModel({
      type: "use",
      amount: totalPrice,
      userId: req.userOid,
      itemId: item._id,
      itemAmount: amount,
      // comment: `${eventConfig?.credit.name} ${totalPrice}개를 사용해 "${item.name}" ${amount}개를 획득했습니다.`,
      comment: `${eventConfig?.credit.name} ${totalPrice}개를 사용해 "${item.name}"에 응모했습니다.`, // 2025 Fall
    });
    await transaction.save();

    // 4단계: 퀘스트를 완료 처리합니다.
    /* 아이템 구매 퀘스트는 2025 가을 이벤트에서는 사용되지 않습니다.
    await contracts.completeItemPurchaseQuest(
      req.userOid,
      transaction.createdAt
    );
    */

    return { result: { result: true } };
  }

  // const randomItem = await getRandomItem(req, 0);
  // if (!randomItem) {
  //   // 랜덤박스가 실패한 경우, 상태를 구매 이전으로 되돌립니다.
  //   // TODO: Transactions 도입 후 이 코드는 삭제합니다.
  //   logger.info(`User ${req.userOid}'s status will be restored`);

  //   await transactionModel.deleteOne({ _id: transaction._id });
  //   await updateEventStatus(req.userOid, {
  //     creditDelta: item.price,
  //   });
  //   await itemModel.updateOne(
  //     { _id: item._id },
  //     {
  //       $inc: {
  //         stock: 1,
  //       },
  //     }
  //   );

  //   logger.info(`User ${req.userOid}'s status was successfully restored`);

  //   return res
  //     .status(500)
  //     .json({ error: "Items/purchase : random box error" });
  // }
};

const purchaseItemHandler = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await itemModel
      .findOne({ _id: itemId, itemType: { $ne: 4 } })
      .lean();
    if (!item)
      return res.status(400).json({ error: "Items/purchase : invalid Item" });

    const { amount } = req.body;
    const { result, error } = await purchaseItem(req, item, amount);
    if (error)
      return res.status(400).json({ error: `Items/purchase : ${error}` });
    return res.json(result);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Items/purchase : internal server error" });
  }
};

const useCouponHandler = async (req, res) => {
  try {
    const { couponCode } = req.params;
    const coupon = await itemModel.findOne({ couponCode, itemType: 4 }).lean();
    if (!coupon)
      return res
        .status(400)
        .json({ error: "Items/useCoupon : invalid coupon" });

    const { result, error } = await purchaseItem(req, coupon, 1);
    if (error)
      return res.status(400).json({ error: `Items/useCoupon : ${error}` });
    return res.json(result);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Items/useCoupon : internal server error" });
  }
};

module.exports = {
  getItemsHandler,
  getItemHandler,
  getItemLeaderboardHandler,
  purchaseItemHandler,
  useCouponHandler,
};
