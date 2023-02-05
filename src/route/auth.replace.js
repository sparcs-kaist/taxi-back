const express = require("express");
const router = express.Router();

const authReplaceHandlers = require("../service/auth.replace");
const setTimestamp = require("../middleware/setTimestamp");
const authMiddleware = require("../middleware/auth");

// 로그인 시도
router.route("/try").post(setTimestamp, authReplaceHandlers.tryHandler);

// html 로그인 페이지 쏴주기
router.route("/sparcssso").get(authReplaceHandlers.sparcsssoHandler);

// 로그아웃
router.route("/logout").get(authReplaceHandlers.logoutHandler);

// FCM 토큰 등록
router
  .route("/registerDeviceToken")
  .post(authMiddleware, authReplaceHandlers.registerDeviceTokenHandler);

module.exports = router;
