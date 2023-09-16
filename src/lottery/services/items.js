const { itemModel, transactionModel } = require("../modules/stores/mongo");
const logger = require("../../modules/logger");
const { useUserCreditAmount } = require("../modules/credit");

const { eventMode } = require("../../../loadenv");
const eventPeriod = eventMode
  ? require(`../modules/contracts/${eventMode}`).eventPeriod
  : undefined;

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
    const newRandomItem = await itemModel
      .findOneAndUpdate(
        { _id: randomItem._id },
        {
          $inc: {
            stock: -1,
          },
        },
        {
          runValidators: true,
          new: true,
          fields: {
            itemType: 0,
            isRandomItem: 0,
            randomWeight: 0,
          },
        }
      )
      .lean();

    const transaction = new transactionModel({
      type: "use",
      amount: 0,
      userId: req.userOid,
      item: randomItem._id,
      itemType: randomItem.itemType,
      comment: `랜덤박스에서 ${randomItem.name} 획득 - 0개 차감`,
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
    const now = Date.now();
    if (now >= eventPeriod.end || now < eventPeriod.start)
      return res.status(400).json({ error: "Items/Purchase : out of date" });

    const { itemId } = req.params;
    const item = await itemModel.findOne({ _id: itemId }).lean();
    if (!item)
      return res.status(400).json({ error: "Items/Purchase : invalid Item" });

    const user = await useUserCreditAmount(req.userOid);
    if (!user)
      return res
        .status(400)
        .json({ error: "Items/Purchase : invalid EventStatus" });

    // 구매 가능 조건: 크레딧이 충분하며, 재고가 남아있으며, 판매 중인 아이템이어야 합니다.
    if (item.isDisabled)
      return res.status(400).json({ error: "Items/Purchase : disabled item" });
    if (user.amount < item.price)
      return res
        .status(400)
        .json({ error: "Items/Purchase : not enough credit" });
    if (item.stock <= 0)
      return res
        .status(400)
        .json({ error: "Items/Purchase : item out of stock" });

    // 1단계: 재고를 차감합니다.
    // 재고가 차감됐으나 유저 크레딧이 차감되지 않은 경우, 나중에 Transaction 기록 분석을 통해 오류 복구가 가능합니다.
    // 하지만 유저 크레딧이 차감됐으나 재고가 차감되지 않은 경우, 다른 유저가 품절된 상품을 구입할 수 있게 되고, 이는 다수의 유저에게 불편을 야기할 수 있습니다.
    await itemModel.updateOne(
      { _id: item._id },
      {
        $inc: {
          stock: -1,
        },
      },
      {
        runValidators: true,
      }
    );

    // 2단계: 유저의 크레딧을 차감합니다.
    await user.update(-item.price);

    // 3단계: Transaction을 추가합니다.
    // Transaction은 가장 마지막에 추가해야 다른 문서와의 불일치를 감지할 수 있습니다.
    const transaction = new transactionModel({
      type: "use",
      amount: item.price,
      userId: req.userOid,
      item: item._id,
      itemType: item.itemType,
      comment: `${item.name} 구입 - ${item.price}개 차감`,
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
