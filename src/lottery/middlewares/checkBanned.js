const { eventStatusModel } = require("../modules/stores/mongo");
const logger = require("../../modules/logger");

/**
 *
 * @param {*} req eventStatus가 성공적일 경우 req.eventStatus = eventStatus로 들어갑니다.
 * @param {*} res
 * @param {*} next
 * @returns
 * 사용자가 차단 되었는지 여부를 판단합니다.
 * 차단된 사용자는 이벤트에 한하여 서비스 이용에 제재를 받습니다.
 */
const checkBanned = async (req, res, next) => {
  try {
    const eventStatus = await eventStatusModel
      .findOne({ userId: req.userOid })
      .lean();
    if (!eventStatus) {
      return res
        .status(400)
        .json({ error: "checkBanned: nonexistent eventStatus" });
    }
    if (eventStatus.isBanned) {
      return res.status(400).json({ error: "checkBanned: banned user" });
    }
    req.eventStatus = eventStatus;
    next();
  } catch (err) {
    logger.error(err);
    res.error(500).json({
      error: "checkBanned: internal server error",
    });
  }
};

module.exports = checkBanned;
