const express = require("express");
const security = require("../../security");
const authReplace = require("./auth.replace");

const router = express.Router();
const setTimestamp = require("../middleware/setTimestamp");
const authHandlers = require("../service/auth");
const mobileAuthHandlers = require("../service/auth.mobile");

router.route("/sparcssso").get(authHandlers.sparcsssoHandler);
router
  .route("/sparcssso/callback")
  .get(setTimestamp, authHandlers.sparcsssoCallbackHandler);
router.route("/logout").get(authHandlers.logoutHandler);

router.route("/app/token/login").get(mobileAuthHandlers.loginWithToken);
router.route("/app/token/refresh").get(mobileAuthHandlers.refreshAccessToken);
router.route("/app/device").post(mobileAuthHandlers.registerDeviceTokenHandler);
router.route("/app/device").delete(mobileAuthHandlers.removeDeviceTokenHandler);
router.route("/app/token/generate").get(authHandlers.generateTokenHandler);

// 환경변수 SPARCSSSO_CLIENT_ID 유무에 따라 로그인 방식이 변경됩니다.
module.exports = security.sparcssso?.id ? router : authReplace;
