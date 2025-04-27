import express from "express";
import { body } from "express-validator";

import { registerDeviceTokenHandler, optionsHandler, editOptionsHandler } from "@/services/notifications";
import validator from "@/middlewares/validator";
import authMiddleware from "@/middlewares/auth";

const router = express.Router();

// 라우터 접근 시 로그인 필요
router.use(authMiddleware);

// FCM 토큰 등록
router.post(
  "/registerDeviceToken",
  [body("deviceToken").isString().isLength({ min: 1, max: 1024 })],
  validator,
  registerDeviceTokenHandler
);

router.get("/options", optionsHandler);

router.post(
  "/editOptions",
  body("options").isObject(),
  body("options.chatting").optional().isBoolean(),
  body("options.keywords").optional().isArray(),
  body("options.keywords.*").optional().isString(),
  body("options.beforeDepart").optional().isBoolean(),
  body("options.notice").optional().isBoolean(),
  body("options.advertisement").optional().isBoolean(),
  validator,
  editOptionsHandler
);

export default router;
