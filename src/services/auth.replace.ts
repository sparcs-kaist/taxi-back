//auth.replace.ts
import { Request, Response } from "express";
import { userModel } from "@/modules/stores/mongo";
import { logout, login } from "@/modules/auths/login";

import { unregisterDeviceToken } from "@/modules/fcm";
import {
  generateNickname,
  generateProfileImageUrl,
} from "@/modules/modifyProfile";
import logger from "@/modules/logger";
import * as jwt from "@/modules/auths/jwt";

import { tryLogin } from "@/services/auth";
import { registerDeviceTokenHandler } from "@/services/auth.mobile";
import loginReplacePage from "@/views/loginReplacePage";

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

const loginReplaceHandler = (req: Request, res: Response) => {
  const { id } = req.body;
  const loginAfterState = req.session?.loginAfterState;
  if (!loginAfterState)
    return res.status(400).send("Auth/login/replace : invalid request");
  const { redirectOrigin, redirectPath } = loginAfterState;
  req.session.loginAfterState = undefined;
  tryLogin(req, res, createUserData(id), redirectOrigin, redirectPath!);
};

const sparcsssoHandler = (req: Request, res: Response) => {
  const redirectPath = decodeURIComponent(
    (req.query?.redirect as string) || "%2F"
  );
  const isApp = !!req.query.isApp;

  req.session.loginAfterState = {
    redirectOrigin: req.origin,
    redirectPath: redirectPath,
  };
  req.session.isApp = isApp;
  res.end(loginReplacePage);
};

const logoutHandler = async (
  req: Request,
  res: {
    json: (arg0: { ssoLogoutUrl: string }) => void;
    status: (arg0: number) => {
      (): any;
      new (): any;
      send: { (arg0: string): void; new (): any };
    };
  }
) => {
  const redirectPath = decodeURIComponent(
    (req.query?.redirect as string) || "%2F"
  );

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

export {
  loginReplaceHandler,
  sparcsssoHandler,
  logoutHandler,
  registerDeviceTokenHandler,
};
