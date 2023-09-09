const { itemModel, transactionModel } = require("../modules/stores/mongo");
const logger = require("../../modules/logger");
const { useUserCreditAmount } = require("../modules/credit");

const getRandomItem = async (req, depth) => {
  if (depth === 10) return null;

  const items = await itemModel.find();
  const randomItems = [];

  for (const item of items) {
    if (!item.isRandomItem) continue;
    if (item.stock === 0) continue;
    if (item.isDisabled) continue;

    randomItems.push(...Array(item.randomWeight).fill(item));
  }

  logger.info(
    `유저 "${req.userOid}"에 의해 getRandomItem(depth=${depth})가 호출되었습니다.`
  );
  logger.info(
    `유저 "${req.userOid}"의 랜덤박스 확률 정보입니다: [${randomItems
      .map((item) => item._id.toString())
      .join(",")}]`
  );

  const randomItem =
    randomItems[Math.floor(Math.random() * randomItems.length)];
  try {
    randomItem.stock--;
    await randomItem.save();

    const transaction = new transactionModel({
      type: "use",
      amount: 0,
      userId: req.userOid,
      itemId: randomItem._id,
      comment: `랜덤박스에서 ${randomItem.name} 획득 - 0개 차감`,
    });
    await transaction.save();

    return randomItem;
  } catch (err) {
    logger.warn(
      `유저 "${req.userOid}"의 랜덤박스 추첨이 실패했습니다. 오류 정보: ${err}`
    );

    return await getRandomItem(depth + 1);
  }
};

const listHandler = async (_, res) => {
  try {
    const items = await itemModel.find(
      {},
      "name imageUrl price description isDisabled stock itemType"
    );
    res.json({ items });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Items/List : internal server error" });
  }
};

const purchaseHandler = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const item = await itemModel.findOne({ _id: itemId });
    if (!item)
      return res.status(400).json({ error: "Items/Purchase : invalid Item" });

    const user = await useUserCreditAmount(req);
    if (!user)
      return res
        .status(400)
        .json({ error: "Items/Purchase : invalid EventStatus" });

    // 구매 가능 조건: 크레딧이 충분하며, 재고가 남아있으며, 판매 중인 아이템이어야 합니다.
    if (item.isDisabled)
      return res.status(400).json({ error: "Items/Purchase : disabled item" });
    if (user.creditAmount < item.price)
      return res
        .status(400)
        .json({ error: "Items/Purchase : not enough credit" });
    if (item.stock === 0)
      return res
        .status(400)
        .json({ error: "Items/Purchase : item out of stock" });

    // 1단계: 재고를 차감합니다.
    // 재고가 차감됐으나 유저 크레딧이 차감되지 않은 경우, 나중에 Transaction 기록 분석을 통해 오류 복구가 가능합니다.
    // 하지만 유저 크레딧이 차감됐으나 재고가 차감되지 않은 경우, 다른 유저가 품절된 상품을 구입할 수 있게 되고, 이는 다수의 유저에게 불편을 야기할 수 있습니다.
    item.stock--;
    await item.save();

    // 2단계: 유저의 크레딧을 차감합니다.
    await user.creditUpdate(-item.price);

    // 3단계: Transaction을 추가합니다.
    // Transaction은 가장 마지막에 추가해야 다른 문서와의 불일치를 감지할 수 있습니다.
    const transaction = new transactionModel({
      type: "use",
      amount: item.price,
      userId: req.userOid,
      itemId: item._id,
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
      reward: {
        _id: randomItem._id,
        name: randomItem.name,
        imageUrl: randomItem.imageUrl,
        price: randomItem.price,
        description: randomItem.description,
        isDisabled: randomItem.isDisabled,
        stock: randomItem.stock,
      },
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
