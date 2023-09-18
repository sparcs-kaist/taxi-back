const express = require("express");
const router = express.Router();
const events = require("../services/quests");

router.use(require("../../middlewares/auth"));
router.post("/instagram/share-event", events.instagramEventShareHandler);
router.post("/instagram/share-purchase", events.instagramPurchaseShareHandler);

module.exports = router;
