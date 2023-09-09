const {
  eventStatusModel,
  transactionModel,
  itemModel,
} = require("../modules/stores/mongo");
const logger = require("../../modules/logger");

const getUserCreditAmount = async (req) => {
  const eventStatus = await eventStatusModel.findOne({ userId: req.userOid });

  return {
    creditAmount: eventStatus.creditAmount,
    creditUpdate: async (delta) => {
      eventStatus.creditAmount += delta;
      await eventStatus.save();
    },
  };
};

const getUserGlobalStateHandler = async (req, res) => {
  try {
    let eventStatus = await eventStatusModel.findOne({ userId: req.userOid });
    if (!eventStatus) {
      // User마다 EventStatus를 가져야 하고, 현재 Taxi에는 회원 탈퇴 시스템이 없으므로, EventStatus가 없으면 새롭게 생성하도록 구현합니다.
      // EventStatus의 생성은 이곳에서만 이루어집니다!!
      eventStatus = new eventStatusModel({
        userId: req.userOid,
      });
      await eventStatus.save();
    }

    const itemPurchaseTransactions = await transactionModel.find({
      userId: req.userOid,
      type: "use",
      itemId: {
        $exists: true,
        $ne: null,
      },
    });
    let ticket1Amount = 0;
    let ticket2Amount = 0;

    for (const purchase of itemPurchaseTransactions) {
      const item = await itemModel.findOne({ _id: purchase.itemId });

      if (item.itemType == 1) {
        ticket1Amount++;
      } else if (item.itemType == 2) {
        ticket2Amount++;
      }
    }

    res.json({
      creditAmount: eventStatus.creditAmount,
      eventStatus: eventStatus.eventList.map((id) => id.toString()),
      ticket1Amount,
      ticket2Amount,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "GlobalState/ : internal server error" });
  }
};

module.exports = {
  getUserCreditAmount,
  getUserGlobalStateHandler,
};
