import express from "express";
import { validateBody, validateParams } from "../../middlewares/zod";
import { itemsZod } from "./docs/schemas/itemsSchema";
import {
  getItemHandler,
  getItemsHandler,
  getItemLeaderboardHandler,
  useCouponHandler,
  purchaseItemHandler,
} from "../services/items";
import { banMiddleware, timestampValidator } from "../middlewares";
import { authMiddleware } from "@/middlewares";
const router = express.Router();

router.get("/", getItemsHandler);
router.get("/:itemId", validateParams(itemsZod.getItemHandler), getItemHandler);
router.get(
  "/leaderboard/:itemId",
  validateParams(itemsZod.getItemLeaderboardHandler),
  getItemLeaderboardHandler
);

// 아래의 Endpoint 접근 시 로그인, 차단 여부 및 시각 체크 필요
router.use(authMiddleware);
router.use(banMiddleware);
router.use(timestampValidator);

router.post(
  "/purchase/:itemId",
  validateParams(itemsZod.purchaseItemHandlerParams),
  validateBody(itemsZod.purchaseItemHandlerBody),
  purchaseItemHandler
);
router.post(
  "/useCoupon/:couponCode",
  validateParams(itemsZod.useCouponHandlerParams),
  useCouponHandler
);

export default router;
