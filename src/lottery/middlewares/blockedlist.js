const { eventStatusModel } = require("../modules/stores/mongo");
const logger = require("../../modules/logger");

const checkBanned = async (req, res, next) => {
  try {
    const eventStatus = await eventStatusModel
      .findOne({ userId: req.userOid })
      .lean();
    if (eventStatus.isBanned) {
      return res.status(400).json({ error: "BlockedList: banned user" });
    } else {
      req.eventStatus = eventStatus;
      next();
    }
  } catch (err) {
    logger.error(err);
    res.error(500).json({
      error: "BlockedList: internal server error",
    });
  }
};

module.exports = checkBanned;
