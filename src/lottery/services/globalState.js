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
    const eventStatus = await eventStatusModel.findOne({ userId: req.userOid });
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
