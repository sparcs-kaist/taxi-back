const express = require("express");

const router = express.Router();
const itemsHandlers = require("../services/items");
const auth = require("../../middlewares/auth");

const { param } = require("express-validator");
const validator = require("../../middlewares/validator");

router.get("/list", itemsHandlers.listHandler);
router.post(
  "/purchase/:itemId",
  auth,
  param("itemId").isMongoId(),
  validator,
  itemsHandlers.purchaseHandler
);

module.exports = router;
