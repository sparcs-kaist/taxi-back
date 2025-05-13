const express = require("express");
const router = express.Router();

const { validateBody, validateParams } = require("../../middlewares/zod");
const { itemsZod } = require("./docs/schemas/itemsSchema");
const itemsHandlers = require("../services/items");

router.get("/", itemsHandlers.getItemsHandler);
router.get(
  "/:itemId",
  validateParams(itemsZod.getItemHandler),
  itemsHandlers.getItemHandler
);
router.get(
  "/leaderboard/:itemId",
  validateParams(itemsZod.getItemLeaderboardHandler),
  itemsHandlers.getItemLeaderboardHandler
);

// 아래의 Endpoint 접근 시 로그인, 차단 여부 및 시각 체크 필요
router.use(require("../../middlewares/auth").default);
router.use(require("../middlewares/eventValidator").default);
router.use(require("../middlewares/timestampValidator"));

router.post(
  "/purchase/:itemId",
  validateParams(itemsZod.purchaseItemHandlerParams),
  validateBody(itemsZod.purchaseItemHandlerBody),
  itemsHandlers.purchaseItemHandler
);
router.post(
  "/useCoupon/:couponCode",
  validateParams(itemsZod.useCouponHandlerParams),
  itemsHandlers.useCouponHandler
);

module.exports = router;
