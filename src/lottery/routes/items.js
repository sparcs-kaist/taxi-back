const express = require("express");

const router = express.Router();
const itemsHandlers = require("../services/items");
const auth = require("../../middlewares/auth");

router.get("/list", itemsHandlers.listHandler);
router.post("/purchase/:itemId", auth, itemsHandlers.purchaseHandler);

module.exports = router;
