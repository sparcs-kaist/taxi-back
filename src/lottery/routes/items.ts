import express from "express";
import { validateBody, validateParams } from "../../middlewares/zod";
import { itemsZod } from "./docs/schemas/itemsSchema";
import itemsHandlers from "../services/items";
import authMiddleware from "../../middlewares/auth";
import checkBanned from "../middlewares/checkBanned";
import timestampValidator from "../middlewares/timestampValidator";
import type { Router } from "express";

const router: Router = express.Router();

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
router.use(authMiddleware);
router.use(checkBanned);
router.use(timestampValidator);

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

export default router;
