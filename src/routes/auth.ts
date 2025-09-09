import express from "express";

import { validateBody, validateQuery } from "@/middlewares";
import { authZod } from "./docs/schemas/authSchema";

import * as authHandlers from "@/services/auth";
import * as authReplaceHandlers from "@/services/auth.replace";
import * as mobileAuthHandlers from "@/services/auth.mobile";
import * as oneAppAuthHandlers from "@/services/auth.oneapp";
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
  authHandlers.logoutHandler
);

router.get(
  "/app/token/login",
  validateQuery(authZod.tokenLoginHandler),
  mobileAuthHandlers.tokenLoginHandler
);

router.get(
  "/app/token/refresh",
  validateQuery(authZod.tokenRefreshHandler),
  mobileAuthHandlers.tokenRefreshHandler
);

router.post(
  "/app/device",
  validateBody(authZod.registerDeviceTokenHandler),
  mobileAuthHandlers.registerDeviceTokenHandler
);

router.delete(
  "/app/device",
  validateBody(authZod.removeDeviceTokenHandler),
  mobileAuthHandlers.removeDeviceTokenHandler
);

// (원앱 전용) 로그인 페이지로 redirect합니다.
router.get(
  "/sparcsapp/login",
  validateQuery(authZod.oneAppLoginHandler),
  (isAuthReplace ? authReplaceHandlers : authHandlers).oneAppLoginHandler
);

// (원앱 전용) 토큰을 issue합니다.
router.post(
  "/sparcsapp/token/issue",
  validateBody(authZod.oneAppTokenIssueHandler),
  oneAppAuthHandlers.oneAppTokenIssueHandler
);

// (원앱 전용) 토큰을 refresh합니다.
router.post(
  "/sparcsapp/token/refresh",
  validateBody(authZod.oneAppTokenRefreshHandler),
  oneAppAuthHandlers.oneAppTokenRefreshHandler
);

export default router;
