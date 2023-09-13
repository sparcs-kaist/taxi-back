const logger = require("../../modules/logger");
const eventHandler = require("../modules/events");
// 인스타그램 스토리에 이벤트를 공유했을 때.
const instagramEventShareHandler = async (req, res) => {
  try {
    const userId = req.userOid;
    // const eventId =
  } catch (err) {
    logger.err(err);
    res.status(500).json({ error: "Events/Insagram/Share-Event" });
  }
};

// 인스타그램 스토리에 아이템 구매 내역을 공유했을 때.
const instagramPurchaseShareHandler = async (req, res) => {
  try {
    const userId = req.userOid;
    // const eventId =
  } catch (err) {
    logger.err(err);
    res.status(500).json({ error: "Events/Insagram/Share-Purchase" });
  }
};

module.exports = {
  instagramEventShareHandler,
  instagramPurchaseShareHandler,
};
