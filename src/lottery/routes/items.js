const express = require("express");

const router = express.Router();
// TODO: 추후 코드 재사용시 상황에 맞춰 zod로 이전이 필요합니다.
const itemsHandlers = require("../services/items");
const itemsSchema = require("./docs/schemas/itemsSchema");

// 아래의 Endpoint는 2024 봄학기 이벤트에서 사용되지 않습니다.
//
// router.get("/list", itemsHandlers.listHandler);

// // 아래의 Endpoint 접근 시 로그인, 차단 여부 체크 및 시각 체크 필요
// router.use(require("../../middlewares/auth"));
// router.use(require("../middlewares/checkBanned"));
// router.use(require("../middlewares/timestampValidator"));

// router.post(
//   "/purchase/:itemId",
//   validateParams(itemsSchema.purchaseHandler),
//   itemsHandlers.purchaseHandler
// );

module.exports = router;
