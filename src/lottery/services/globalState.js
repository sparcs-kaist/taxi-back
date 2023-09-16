const {
  eventStatusModel,
  transactionModel,
} = require("../modules/stores/mongo");
const logger = require("../../modules/logger");

const { eventMode } = require("../../../loadenv");
const quests = eventMode
  ? Object.values(require(`../modules/contracts/${eventMode}`).quests)
  : undefined;

const getUserGlobalStateHandler = async (req, res) => {
  try {
    let eventStatus = await eventStatusModel
      .findOne({ userId: req.userOid })
      .lean();
    if (!eventStatus) {
      eventStatus = new eventStatusModel({
        userId: req.userOid,
      });
      await eventStatus.save();
    }

    const ticket1Amount = await transactionModel.count({
      userId: req.userOid,
      type: "use",
      item: {
        $exists: true,
        $ne: null,
      },
      itemType: 1,
    });
    const ticket2Amount = await transactionModel.count({
      userId: req.userOid,
      type: "use",
      item: {
        $exists: true,
        $ne: null,
      },
      itemType: 2,
    });

    res.json({
      creditAmount: eventStatus.creditAmount,
      completedQuests: eventStatus.completedQuests,
      ticket1Amount,
      ticket2Amount,
      quests,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "GlobalState/ : internal server error" });
  }
};

module.exports = {
  getUserGlobalStateHandler,
};
