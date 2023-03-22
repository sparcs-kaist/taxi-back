const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const authReplaceHandlers = require("../services/auth.replace");
const authMiddleware = require("../middlewares/auth");
const validator = require("../middlewares/validator");

// 로그인 시도
router.route("/try").post(authReplaceHandlers.tryHandler);

// html 로그인 페이지 쏴주기
router.route("/sparcssso").get(authReplaceHandlers.sparcsssoHandler);

// 로그아웃
router.route("/logout").get(authReplaceHandlers.logoutHandler);

// FCM 토큰 등록
router.post(
  "/registerDeviceToken",
  authMiddleware,
  [body("deviceToken").isString().isLength({ min: 1, max: 1024 })],
  validator,
  authReplaceHandlers.registerDeviceTokenHandler
);

module.exports = router;
