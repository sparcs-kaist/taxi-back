const logger = require("../../modules/logger");
const contracts = require("../modules/contracts/2023fall");

/**
 * 방을 공유했을 때.
 */
const roomShareHandler = async (req, res) => {
  try {
    const { userOid } = req;
    const contractResult = await contracts.completeRoomSharingQuest(
      userOid,
      req.timestamp
    );
    res.json({ result: !!contractResult });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Quests/ShareRoom: internal server error" });
  }
};

/**
 * 인스타그램 스토리에 이벤트를 공유했을 때.
 */
const instagramEventShareHandler = async (req, res) => {
  try {
    const { userOid } = req;
    const contractResult = await contracts.completeEventSharingOnInstagramQuest(
      userOid,
      req.timestamp
    );
    res.json({ result: !!contractResult });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "Quests/Instagram/ShareEvent: internal server error" });
  }
};

/**
 * 인스타그램 스토리에 아이템 구매 내역을 공유했을 때.
 */
const instagramPurchaseShareHandler = async (req, res) => {
  try {
    const { userOid } = req;
    const contractResult =
      await contracts.completePurchaseSharingOnInstagramQuest(
        userOid,
        req.timestamp
      );
    res.json({ result: !!contractResult });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "Quests/Instagram/SharePurchase: internal server error" });
  }
};

module.exports = {
  roomShareHandler,
  instagramEventShareHandler,
  instagramPurchaseShareHandler,
};
