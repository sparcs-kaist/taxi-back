const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const notificationHandlers = require("../service/notifications");
const validator = require("../middleware/validator");

// 라우터 접근 시 로그인 필요
router.use(require("../middleware/auth"));

router.get(
  "/options",
  body("deviceToken").isString(),
  notificationHandlers.getNotificationOptions
);

router.patch(
  "/options",
  body("deviceToken").isString(),
  body("options").isObject(),
  body("options.chatting").optional().isBoolean(),
  body("options.keywords").optional().isArray(),
  body("options.keywords.*").optional().isString(),
  body("options.beforeDepart").optional().isBoolean(),
  body("options.notice").optional().isBoolean(),
  body("options.advertisement").optional().isBoolean(),
  validator,
  notificationHandlers.changeNotificationOptions
);

module.exports = router;