const {
  eventStatusModel,
  itemModel,
  transactionModel,
} = require("../modules/stores/mongo");
const logger = require("../../modules/logger");

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

const { eventConfig } = require("../../../loadenv");
const eventPeriod = eventConfig && {
  startAt: new Date(eventConfig.startAt),
  endAt: new Date(eventConfig.endAt),
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
    .map((item) => {
      return Array(item.randomWeight).fill(item);
    })
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
      throw new Error("The item was already sold out");
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
      item: randomItem._id,
      comment: `랜덤 박스에서 "${randomItem.name}" 1개를 획득했습니다.`,
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

const listHandler = async (_, res) => {
  try {
    const items = await itemModel
      .find({}, "name imageUrl price description isDisabled stock itemType")
      .lean();
    res.json({ items });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Items/List : internal server error" });
  }
};

const purchaseHandler = async (req, res) => {
  try {
    const eventStatus = await eventStatusModel.findOne({ userId: req.userOid });
    if (!eventStatus)
      return res
        .status(400)
        .json({ error: "Items/Purchase : nonexistent eventStatus" });

    if (
      req.timestamp >= eventPeriod.endAt ||
      req.timestamp < eventPeriod.startAt
    )
      return res.status(400).json({ error: "Items/Purchase : out of date" });

    const { itemId } = req.params;
    const item = await itemModel.findOne({ _id: itemId }).lean();
    if (!item)
      return res.status(400).json({ error: "Items/Purchase : invalid Item" });

    // 구매 가능 조건: 크레딧이 충분하며, 재고가 남아있으며, 판매 중인 아이템이어야 합니다.
    if (item.isDisabled)
      return res.status(400).json({ error: "Items/Purchase : disabled item" });
    if (eventStatus.creditAmount < item.price)
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
    if (modifiedCount === 0) throw new Error("The item was already sold out");

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
      item: item._id,
      comment: `송편 ${item.price}개를 사용해 "${item.name}" 1개를 획득했습니다.`,
    });
    await transaction.save();

    // 4단계: 랜덤박스인 경우 아이템을 추첨합니다.
    if (item.itemType !== 3) return res.json({ result: true });

    const randomItem = await getRandomItem(req, 0);
    if (!randomItem)
      return res
        .status(500)
        .json({ error: "Items/Purchase : random box error" });

    res.json({
      result: true,
      reward: randomItem,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Items/Purchase : internal server error" });
  }
};

module.exports = {
  listHandler,
  purchaseHandler,
};
