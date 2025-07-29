import type { RequestHandler } from "express";
import { logout } from "@/modules/auths/login";

import { unregisterDeviceToken } from "@/modules/fcm";
import {
  generateNickname,
  generateProfileImageUrl,
} from "@/modules/modifyProfile";

import { tryLogin } from "@/services/auth";
import loginReplacePage from "@/views/loginReplacePage";
import {
  LoginReplaceBody,
  SparcsssoQuery,
  LogoutQuery,
} from "@/routes/docs/schemas/authSchema";

const createUserData = (id: string) => {
  const info = {
    id: id,
    sid: id + "-sid",
    name: id + "-name",
    nickname: generateNickname(id),
    profileImageUrl: generateProfileImageUrl(),
    facebook: id + "-facebook",
    twitter: id + "-twitter",
    kaist: "20220411",
    sparcs: id + "-sparcs",
    email: "taxi@sparcs.org",
  };
  return info;
};

export const loginReplaceHandler: RequestHandler = (req, res) => {
  const { id }: LoginReplaceBody = req.body;
  const loginAfterState = req.session?.loginAfterState;
  if (!loginAfterState)
    return res.status(400).send("Auth/login/replace : invalid request");
  const { redirectOrigin, redirectPath } = loginAfterState;
  req.session.loginAfterState = undefined;
  tryLogin(req, res, createUserData(id), redirectOrigin, redirectPath!);
};

export const sparcsssoHandler: RequestHandler = (req, res) => {
  const { redirect, isApp }: SparcsssoQuery = req.query;
  const redirectPath = decodeURIComponent(redirect || "%2F");

  req.session.loginAfterState = {
    redirectOrigin: req.origin,
    redirectPath: redirectPath,
  };
  req.session.isApp = isApp;
  res.end(loginReplacePage);
};

export const logoutHandler: RequestHandler = async (req, res) => {
  const { redirect }: LogoutQuery = req.query;
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
