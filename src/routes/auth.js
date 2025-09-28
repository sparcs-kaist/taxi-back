const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");
const validator = require("@/middlewares/validator").default;

const authHandlers = require("@/services/auth");
const authReplaceHandlers = require("@/services/auth.replace");
const mobileAuthHandlers = require("@/services/auth.mobile");
const { isAuthReplace } = require("@/modules/auths/login");

// 로그인 페이지로 redirect합니다.
router.get(
  "/sparcssso",
  query("redirect").optional().isString(),
  query("isApp").optional().isBoolean(),
  validator,
  (isAuthReplace ? authReplaceHandlers : authHandlers).sparcsssoHandler
);

// 스팍스 SSO에서 callback을 받으면 front로 redirect 합니다.
router.get("/sparcssso/callback", authHandlers.sparcsssoCallbackHandler);

// replace 로그인을 시도합니다.
router.post(
  "/login/replace",
  body("id").isString(),
  body("redirect").optional().isString(),
  validator,
  (isAuthReplace ? authReplaceHandlers : authHandlers).loginReplaceHandler
);

// 로그아웃 후 redirect
router.get(
  "/logout",
  query("redirect").optional().isString(),
  validator,
  (isAuthReplace ? authReplaceHandlers : authHandlers).logoutHandler
);

router.get("/app/token/login", mobileAuthHandlers.tokenLoginHandler);
// FIXME: accessToken, deviceToken validation 추가
router.get("/app/token/refresh", mobileAuthHandlers.tokenRefreshHandler);
// FIXME: accessToken, refreshToken validation 추가
router.post("/app/device", mobileAuthHandlers.registerDeviceTokenHandler);
// FIXME: accessToken, deviceToken validation 추가
router.delete("/app/device", mobileAuthHandlers.removeDeviceTokenHandler);
// FIXME: accessToken, deviceToken validation 추가

module.exports = router;
