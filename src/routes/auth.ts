import express from "express";

import { validateBody, validateQuery } from "@/middlewares/zod";
import { authZod } from "./docs/schemas/authSchema";

import * as authHandlers from "@/services/auth";
import * as authReplaceHandlers from "@/services/auth.replace";
import * as mobileAuthHandlers from "@/services/auth.mobile";
import { isAuthReplace } from "@/modules/auths/login";

const router = express.Router();

// 로그인 페이지로 redirect합니다.
router.get(
  "/sparcssso",
  validateQuery(authZod.sparcsssoHandler),
  (isAuthReplace ? authReplaceHandlers : authHandlers).sparcsssoHandler
);

// 스팍스 SSO에서 callback을 받으면 front로 redirect 합니다.
router.get("/sparcssso/callback", authHandlers.sparcsssoCallbackHandler);

// replace 로그인을 시도합니다.
router.post(
  "/login/replace",
  validateBody(authZod.loginReplaceHandler),
  (isAuthReplace ? authReplaceHandlers : authHandlers).loginReplaceHandler
);

// 로그아웃 후 redirect
router.get(
  "/logout",
  validateQuery(authZod.logoutHandler),
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

export default router;
