const logger = require("../../modules/logger");
const contracts = require("../modules/contracts/2023fall");

// 인스타그램 스토리에 이벤트를 공유했을 때.
const instagramEventShareHandler = async (req, res) => {
  try {
    const { userOid: userId } = req;
    const contractResult = await contracts.completeEventSharingOnInstagramQuest(
      userId
    );
    res.json({ result: !!contractResult });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "Quests/Instagram/ShareEvent: internal server error" });
  }
};

// 인스타그램 스토리에 아이템 구매 내역을 공유했을 때.
const instagramPurchaseShareHandler = async (req, res) => {
  try {
    const userId = req.userOid;
    const contractResult =
      await contracts.completePurchaseSharingOnInstagramQuest(userId);
    res.json({ result: !!contractResult });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "Quests/Instagram/SharePurchase: internal server error" });
  }
};

module.exports = {
  instagramEventShareHandler,
  instagramPurchaseShareHandler,
};
