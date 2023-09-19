const express = require("express");

const router = express.Router();
const itemsHandlers = require("../services/items");

const { validateParams } = require("../../middlewares/ajv");
const itemsSchema = require("./docs/itemsSchema");

router.get("/list", itemsHandlers.listHandler);

// 아래의 Endpoint 접근 시 로그인 필요
router.use(require("../../middlewares/auth"));

router.post(
  "/purchase/:itemId",
  validateParams(itemsSchema.purchaseHandler),
  itemsHandlers.purchaseHandler
);

module.exports = router;
