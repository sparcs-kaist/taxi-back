const { transactionModel } = require("../modules/stores/mongo");

// 이벤트 코드입니다.(sori)
//const { eventStatusModel } = require("../modules/stores/mongo");

const {
  transactionPopulateOption,
} = require("../modules/populates/transactions");
const logger = require("@/modules/logger").default;

// 이벤트 코드입니다.(sori)
//const { eventConfig } = require("@/loadenv");

const formatTransaction = (transaction) => {
  if (transaction.itemId) {
    transaction.item = transaction.itemId;
    delete transaction.itemId;
  }
  return transaction;
};

const getUserTransactionsHandler = async (req, res) => {
  try {
    const transactions = await transactionModel
      .find(
        { userId: req.userOid },
        "type amount questId itemId comment createdAt"
      )
      .populate(transactionPopulateOption)
      .lean();
    if (!transactions)
      return res
        .status(500)
        .json({ error: "Transactions/ : internal server error" });

    res.json({
      transactions: transactions.map(formatTransaction),
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Transactions/ : internal server error" });
  }
};

// 이벤트 코드입니다.(sori)
/*
기존 퀘스트 보상 방식 사용 안하는 방식으로 동작하는 함수들입니다.
function isWithinEvent(ts) {
  if (!eventConfig?.period) return false;
  const t = new Date(ts);
  return (
    t >= new Date(eventConfig.period.startAt) &&
    t < new Date(eventConfig.period.endAt)
  );
}

// POST /lottery/transactions/enter
// body: { prizeType: "coffee"|"chicken"|"pizza", count: number }
const enterRaffleHandler = async (req, res) => {
  try {
    const { prizeType, count } = req.body || {};
    if (!["coffee", "chicken", "pizza"].includes(prizeType)) {
      return res
        .status(400)
        .json({ error: "Transactions/enter : invalid prizeType" });
    }
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1) {
      return res
        .status(400)
        .json({ error: "Transactions/enter : invalid count" });
    }
    if (!isWithinEvent(req.timestamp)) {
      return res
        .status(400)
        .json({ error: "Transactions/enter : event closed" });
    }

    const status = await eventStatusModel
      .findOne({ userId: req.userOid }, "ticket1Amount")
      .lean();
    const current = status?.ticket1Amount ?? 0;
    if (current < n) {
      return res
        .status(400)
        .json({ error: "Transactions/enter : insufficient tickets" });
    }

    // 트랜잭션 기록 (사용)
    await transactionModel.create({
      userId: req.userOid,
      type: "use",
      amount: n,
      comment: `enter:${prizeType}`,
    });
    // 지갑 차감
    await eventStatusModel.updateOne(
      { userId: req.userOid },
      { $inc: { ticket1Amount: -n } },
      { upsert: true }
    );

    return res.json({ ok: true, prizeType, used: n, remaining: current - n });
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ error: "Transactions/enter : internal server error" });
  }
};
*/
//

module.exports = {
  getUserTransactionsHandler,
  //enterRaffleHandler, // 이벤트 코드입니다.(sori)
};
