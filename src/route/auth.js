const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const authMiddleware = require("../middleware/auth");
const validator = require("../middleware/validator");
const authHandlers = require("../service/auth");
const mobileAuthHandlers = require("../service/auth.mobile");

const security = require("../../security");
const authReplace = require("./auth.replace");

router.route("/sparcssso").get(authHandlers.sparcsssoHandler);
router.route("/sparcssso/callback").get(authHandlers.sparcsssoCallbackHandler);
router.route("/logout").get(authHandlers.logoutHandler);

router.route("/app/token/login").get(mobileAuthHandlers.loginWithToken);
router.route("/app/token/refresh").get(mobileAuthHandlers.refreshAccessToken);
router.route("/app/device").post(mobileAuthHandlers.registerDeviceTokenHandler);
router.route("/app/device").delete(mobileAuthHandlers.removeDeviceTokenHandler);
router.route("/app/token/generate").get(authHandlers.generateTokenHandler);
// FCM 토큰 등록
router.post(
  "/registerDeviceToken",
  authMiddleware,
  [body("deviceToken").isString().isLength({ min: 1, max: 1024 })],
  validator,
  authHandlers.registerDeviceTokenHandler
);

// 환경변수 SPARCSSSO_CLIENT_ID 유무에 따라 로그인 방식이 변경됩니다.
module.exports = security.sparcssso?.id ? router : authReplace;
