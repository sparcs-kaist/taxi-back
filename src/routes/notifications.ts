import express from "express";
import { validateBody } from "@/middlewares/zod";
import { notificationZod } from "@/routes/docs/schemas/notificationSchema";
import {
  registerDeviceTokenHandler,
  optionsHandler,
  editOptionsHandler,
} from "@/services/notifications";
import { authMiddleware } from "@/middlewares";

const router = express.Router();

// 라우터 접근 시 로그인 필요
router.use(authMiddleware);

// FCM 토큰 등록
router.post(
  "/registerDeviceToken",
  validateBody(notificationZod.registerDeviceTokenHandler),
  registerDeviceTokenHandler
);

router.get("/options", optionsHandler);

router.post(
  "/editOptions",
  validateBody(notificationZod.editOptionsHandler),
  editOptionsHandler
);

export default router;
