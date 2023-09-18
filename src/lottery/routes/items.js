const express = require("express");

const router = express.Router();
const itemsHandlers = require("../services/items");
const auth = require("../../middlewares/auth");

const { validateParams } = require("../../middlewares/ajv");
const itemsSchema = require("./docs/itemsSchema");

router.get("/list", itemsHandlers.listHandler);
router.post(
  "/purchase/:itemId",
  auth,
  validateParams(itemsSchema.purchaseHandler),
  itemsHandlers.purchaseHandler
);

module.exports = router;
