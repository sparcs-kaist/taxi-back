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
      // User마다 EventStatus를 가져야 하고, 현재 Taxi에는 회원 탈퇴 시스템이 없으므로, EventStatus가 없으면 새롭게 생성하도록 구현합니다.
      // EventStatus의 생성은 이곳에서만 이루어집니다!!
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
