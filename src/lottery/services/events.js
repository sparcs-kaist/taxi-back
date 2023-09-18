const logger = require("../../modules/logger");
const contracts = require("../modules/contracts/2023fall");

// 인스타그램 스토리에 이벤트를 공유했을 때.
const instagramEventShareHandler = async (req, res) => {
  try {
    const contractsResult = contracts.completeEventSharingOnInstagramQuest(req.userOid);
    if (contractsResult) {
      res.json({ contractsResult });
    } else if (contractsResult === null) {
      res.json({ contractsResult });
    } else {
      logger.error(err);
      res.json({ error: "Events/Insagram/Share-Event" });
    }
  } catch (err) {
    logger.error(err);
    res.json({ error: "Events/Insagram/Share-Event" });
  }
};

// 인스타그램 스토리에 아이템 구매 내역을 공유했을 때.
const instagramPurchaseShareHandler = async (req, res) => {
  try {
    const contractsResult = contracts.completePurchaseSharingOnInstagramQuest(req.userOid);
    if (contractsResult) {
      res.json({ contractsResult });
    } else if (contractsResult === null) {
      res.json({ contractsResult });
    } else {
      logger.error(err);
      return { error: "Events/Insagram/Share-Purchase" };
    }
  } catch (err) {
    logger.error(err);
    return { error: "Events/Insagram/Share-Purchase" };
  }
};

module.exports = {
  instagramEventShareHandler,
  instagramPurchaseShareHandler,
};
