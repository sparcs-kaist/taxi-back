const express = require("express");
const router = express.Router();
const { query } = require("express-validator");
const validator = require("../middlewares/validator");

const authHandlers = require("../services/auth");
const mobileAuthHandlers = require("../services/auth.mobile");

const { sparcssso: sparcsssoEnv } = require("../../loadenv");
const authReplace = require("./auth.replace");

router.get(
  "/sparcssso",
  query("redirect").optional().isString(),
  validator,
  authHandlers.sparcsssoHandler
);
router.get("/sparcssso/callback", authHandlers.sparcsssoCallbackHandler);
router.get(
  "/logout",
  query("redirect").optional().isString(),
  validator,
  authHandlers.logoutHandler
);

router.get("/app/token/login", mobileAuthHandlers.loginWithToken);
router.get("/app/token/refresh", mobileAuthHandlers.refreshAccessToken);
router.post("/app/device", mobileAuthHandlers.registerDeviceTokenHandler);
router.delete("/app/device", mobileAuthHandlers.removeDeviceTokenHandler);
router.get("/app/token/generate", authHandlers.generateTokenHandler);

// 환경변수 SPARCSSSO_CLIENT_ID 유무에 따라 로그인 방식이 변경됩니다.
module.exports = sparcsssoEnv?.id ? router : authReplace;
