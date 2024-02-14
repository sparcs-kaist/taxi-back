const express = require("express");
const { eventConfig } = require("../../../loadenv");

const router = express.Router();
const itemsHandlers = require("../services/items");

const { validateParams } = require("../../middlewares/ajv");
const itemsSchema = require("./docs/itemsSchema");

// 아래의 Endpoint는 2023년 가을학기 이벤트 때에만 접근 가능
if (eventConfig.mode === "2023fall") {
  router.get("/list", itemsHandlers.listHandler);

  // 아래의 Endpoint 접근 시 로그인, 차단 여부 체크 및 시각 체크 필요
  router.use(require("../../middlewares/auth"));
  router.use(require("../middlewares/checkBanned"));
  router.use(require("../middlewares/timestampValidator"));

  router.post(
    "/purchase/:itemId",
    validateParams(itemsSchema.purchaseHandler),
    itemsHandlers.purchaseHandler
  );
}

module.exports = router;
