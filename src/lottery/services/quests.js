const logger = require("../../modules/logger");
const contracts = require("../modules/contracts/2023fall");

const { eventConfig } = require("../../../loadenv");
const eventPeriod = eventConfig && {
  startAt: new Date(eventConfig.startAt),
  endAt: new Date(eventConfig.endAt),
};

/**
 * 인스타그램 스토리에 이벤트를 공유했을 때.
 */
const instagramEventShareHandler = async (req, res) => {
  try {
    if (
      req.timestamp >= eventPeriod.endAt ||
      req.timestamp < eventPeriod.startAt
    )
      return res
        .status(400)
        .json({ error: "Quests/Instagram/ShareEvent : out of date" });

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
    if (
      req.timestamp >= eventPeriod.endAt ||
      req.timestamp < eventPeriod.startAt
    )
      return res
        .status(400)
        .json({ error: "Quests/Instagram/SharePurchase : out of date" });

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
  instagramEventShareHandler,
  instagramPurchaseShareHandler,
};
