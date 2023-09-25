const { eventStatusModel } = require("../modules/stores/mongo");
const logger = require("../../modules/logger");

const isBanned = async (req, res, next) => {
  try {
    const eventStatus = await eventStatusModel.findOne({ userId: req.userOid });
    if (eventStatus.isBanned) {
      return res.status(400).json({ error: "Blockedlist : banned user" });
    } else {
      next();
    }
  } catch (err) {
    logger.error(err);
    res.error(500).json({
      error: "Blockedlist error : internal server error",
    });
  }
};

module.exports = isBanned;
