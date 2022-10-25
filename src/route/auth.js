const express = require("express");
const security = require("../../security");
const authReplace = require("./auth.replace");

const router = express.Router();
const setTimestamp = require("../middleware/setTimestamp");
const authHandlers = require("../service/auth");

router.route("/sparcssso").get(authHandlers.sparcsssoHandler);
router
  .route("/sparcssso/callback")
  .get(setTimestamp, authHandlers.sparcsssoCallbackHandler);
router.route("/logout").get(authHandlers.logoutHandler);

router.route("/loginwithtoken").get(authHandlers.loginWithToken);
router.route("/refreshToken").get(authHandlers.refreshAccessToken);
router.route("/device").post(authHandlers.registerDeviceTokenHandler);
router.route("/login/app").get(authHandlers.sparcsssoForAppHandler);

// 환경변수 SPARCSSSO_CLIENT_ID 유무에 따라 로그인 방식이 변경됩니다.
module.exports = security.sparcssso?.id ? router : authReplace;
