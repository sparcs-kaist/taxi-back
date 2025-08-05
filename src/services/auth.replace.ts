import { logout } from "@/modules/auths/login";
import { unregisterDeviceToken } from "@/modules/fcm";
import { transUserData, tryLogin } from "@/services/auth";
import loginReplacePage from "@/views/loginReplacePage";

import type { RequestHandler } from "express";
import type {
  LoginReplaceBody,
  SparcsssoQuery,
  LogoutQuery,
  OneAppLoginQuery,
} from "@/routes/docs/schemas/authSchema";

// tryLogin 함수에 필요한 더미 userDataBefore, userData 값을 생성하는 함수
const createUserData = (uid: string) => {
  const userDataBefore = {
    uid,
    sid: uid + "-sid",
    email: "taxi@sparcs.org",
    first_name: uid + "-firstname",
    last_name: uid + "-lastname",
    gender: "*H",
    birthday: "",
    flags: ["TEST", "SPARCS"],
    facebook_id: uid + "-facebook",
    twitter_id: uid + "-twitter",
    kaist_id: "20230113",
    kaist_info: null,
    kaist_info_time: "",
    kaist_v2_info: null,
    kaist_v2_info_time: "",
    sparcs_id: uid + "-sparcs",
  };
  const userData = {
    ...transUserData(userDataBefore),
    name: uid + "-name",
    kaist: "20230113",
  };
  return { userDataBefore, userData };
};

export const loginReplaceHandler: RequestHandler = (req, res) => {
  const { id } = req.body as LoginReplaceBody;
  const loginAfterState = req.session?.loginAfterState;
  if (!loginAfterState)
    return res.status(400).send("Auth/login/replace : invalid request");

  const { redirectOrigin, redirectPath } = loginAfterState;
  req.session.loginAfterState = undefined;

  const { userDataBefore, userData } = createUserData(id);
  tryLogin(req, res, userDataBefore, userData, redirectOrigin!, redirectPath!);
};

export const sparcsssoHandler: RequestHandler = (req, res) => {
  const { redirect, isApp } = req.query as unknown as SparcsssoQuery;
  const redirectPath = decodeURIComponent(redirect || "%2F");

  req.session.loginAfterState = {
    redirectOrigin: req.origin,
    redirectPath: redirectPath,
  };
  req.session.isApp = isApp;
  res.end(loginReplacePage);
};

export const logoutHandler: RequestHandler = async (req, res) => {
  const { redirect } = req.query as LogoutQuery;
  const redirectPath = decodeURIComponent(redirect || "%2F");

  try {
    // DB에서 deviceToken 레코드를 삭제합니다.
    const deviceToken = req.session?.deviceToken;
    if (deviceToken) {
      await unregisterDeviceToken(deviceToken);
    }

    // sparcs-sso 로그아웃 URL을 생성 및 반환
    const ssoLogoutUrl = new URL(redirectPath, req.origin).href;
    logout(req);
    res.json({ ssoLogoutUrl });
  } catch (e) {
    res.status(500).send("Auth/logout : internal server error");
  }
};

export const oneAppLoginHandler: RequestHandler = (req, res) => {
  const { codeChallenge } = req.query as OneAppLoginQuery;

  req.session.loginAfterState = {};
  req.session.isApp = false;
  req.session.oneAppState = { codeChallenge };
  res.end(loginReplacePage);
};
