const express = require("express");
const router = express.Router();
const quests = require("../services/quests");

router.use(require("../../middlewares/auth"));
router.use(require("../middlewares/timestampValidator"));

router.post("/instagram/share-event", quests.instagramEventShareHandler);
router.post("/instagram/share-purchase", quests.instagramPurchaseShareHandler);

module.exports = router;
