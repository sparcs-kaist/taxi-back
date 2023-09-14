const {
  eventStatusModel,
  eventModel,
  transactionModel,
  itemModel,
} = require("../modules/stores/mongo");
const logger = require("../../modules/logger");

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

    const events = await eventModel.find({}, "-__v").lean();

    res.json({
      creditAmount: eventStatus.creditAmount,
      eventStatus: eventStatus.eventList.map((id) => id.toString()),
      ticket1Amount: eventStatus.ticket1Amount,
      ticket2Amount: eventStatus.ticket2Amount,
      events,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "GlobalState/ : internal server error" });
  }
};

module.exports = {
  getUserGlobalStateHandler,
};
