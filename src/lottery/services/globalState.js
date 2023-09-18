const { eventStatusModel } = require("../modules/stores/mongo");
const logger = require("../../modules/logger");

const { eventMode } = require("../../../loadenv");
const contract = eventMode
  ? require(`../modules/contracts/${eventMode}`)
  : undefined;
const quests = contract ? Object.values(contract.quests) : undefined;

const getUserGlobalStateHandler = async (req, res) => {
  try {
    const eventStatus = await eventStatusModel
      .findOne({ userId: req.userOid })
      .lean();
    if (eventStatus)
      res.json({
        agreement: true,
        creditAmount: eventStatus.creditAmount,
        completedQuests: eventStatus.completedQuests,
        ticket1Amount: eventStatus.ticket1Amount,
        ticket2Amount: eventStatus.ticket2Amount,
        quests,
      });
    else
      res.json({
        agreement: false,
        creditAmount: 0,
        completedQuests: [],
        ticket1Amount: 0,
        ticket2Amount: 0,
        quests,
      });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "GlobalState/ : internal server error" });
  }
};

const createUserGlobalStateHandler = async (req, res) => {
  try {
    let eventStatus = await eventStatusModel
      .findOne({ userId: req.userOid })
      .lean();
    if (eventStatus)
      return res
        .status(400)
        .json({ error: "GlobalState/Create : already created" });

    eventStatus = new eventStatusModel({
      userId: req.userOid,
    });
    await eventStatus.save();

    await contract.completeFirstLoginQuest(req.userOid, req.timestamp);

    res.json({ result: true });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "GlobalState/Create : internal server error" });
  }
};

module.exports = {
  getUserGlobalStateHandler,
  createUserGlobalStateHandler,
};
