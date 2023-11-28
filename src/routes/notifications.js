const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const notificationHandlers = require("@/services/notifications");
const validator = require("@/middlewares/validator");

// 라우터 접근 시 로그인 필요
router.use(require("@/middlewares/auth"));

// FCM 토큰 등록
router.post(
  "/registerDeviceToken",
  [body("deviceToken").isString().isLength({ min: 1, max: 1024 })],
  validator,
  notificationHandlers.registerDeviceTokenHandler
);

router.get("/options", notificationHandlers.optionsHandler);

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
  notificationHandlers.editOptionsHandler
);

module.exports = router;
