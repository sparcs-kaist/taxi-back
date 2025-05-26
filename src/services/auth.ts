import { Request, Response } from "express";
import { nodeEnv, testAccounts } from "@/loadenv";
import { userModel } from "@/modules/stores/mongo";

import patterns from "@/modules/patterns";
const { user: userPattern } = patterns;

import { ssoClient, getLoginInfo, logout, login } from "@/modules/auths/login";

import { unregisterDeviceToken } from "@/modules/fcm";
import {
  generateNickname,
  generateProfileImageUrl,
  getFullUsername,
} from "@/modules/modifyProfile";
import * as jwt from "@/modules/auths/jwt";
import logger from "@/modules/logger";

type userDataType = {
  email: any;
  id: string;
  sid: any;
  uid?: any;
  name?: any;
  nickname?: string;
  kaist?: any;
  kaistType?: any;
  kaist_info?: string;
  sparcs?: any;
  sparcs_id?: any;
  facebook?: any;
  facebook_id?: any;
  twitter?: any;
  twitter_id?: any;
  first_name?: string;
  last_name?: string;
  isEligible?: boolean;
};

const transUserData = (userData: {
  kaist_info: string;
  uid: any;
  sid: any;
  first_name: string;
  last_name: string;
  facebook_id?: any;
  twitter_id?: any;
  sparcs_id?: any;
  email?: any;
}) => {
  const kaistInfo = userData.kaist_info ? JSON.parse(userData.kaist_info) : {};

  // info.ku_std_no: 학번
  // info.isEligible: 카이스트 구성원인지 여부
  const info = {
    id: userData.uid,
    sid: userData.sid,
    name: getFullUsername(userData.first_name, userData.last_name),
    facebook: userData.facebook_id || "",
    twitter: userData.twitter_id || "",
    kaist: kaistInfo?.ku_std_no || "",
    kaistType: kaistInfo?.employeeType || "", // DB에 저장하지 않음
    sparcs: userData.sparcs_id || "",
    email: kaistInfo?.mail || userData.email,
    isEligible: userPattern.allowedEmployeeTypes.test(kaistInfo?.employeeType), // DB에 저장하지 않음
  };
  return info;
};

const joinus = async (
  req: Request,
  userData: userDataType & { name: any; kaist: any }
) => {
  const oldUser = await userModel
    .findOne(
      {
        id: userData.id,
        withdraw: true,
      },
      "withdrewAt"
    )
    .sort({ withdrewAt: -1 })
    .lean();
  if (oldUser && oldUser.withdrewAt) {
    // 탈퇴 후 7일이 지나지 않았을 경우, 가입을 거부합니다.
    if (typeof req.timestamp === "undefined") {
      return false;
    }
    const diff = req.timestamp - oldUser.withdrewAt.getTime();
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return false;
    }
  }

  const newUser = new userModel({
    id: userData.id, // NOTE: SSO uid
    name: userData.name,
    nickname: generateNickname(userData.id),
    profileImageUrl: generateProfileImageUrl(),
    joinat: req.timestamp,
    subinfo: {
      kaist: userData.kaist,
      sparcs: userData.sparcs,
      facebook: userData.facebook,
      twitter: userData.twitter,
    },
    email: userData.email,
  });
  await newUser.save();
  return true;
};

const update = async (userData: {
  name: any;
  email: any;
  kaist: any;
  id: any;
}) => {
  const updateInfo = {
    name: userData.name,
    email: userData.email,
    "subinfo.kaist": userData.kaist,
  };
  await userModel.updateOne({ id: userData.id, withdraw: false }, updateInfo); // NOTE: SSO uid 쓰는 곳
  logger.info(
    `Update user info: ${userData.id} ${userData.name} ${userData.email} ${userData.kaist}`
  );
};

export const tryLogin = async (
  req: Request,
  res: Response,
  userData: userDataType & { name: any; kaist: any },
  redirectOrigin: string | URL | undefined,
  redirectPath: string | URL
): Promise<void> => {
  try {
    const user = await userModel.findOne(
      { id: userData.id, withdraw: false }, // NOTE: SSO uid 쓰는 곳
      "_id name email subinfo id withdraw ban"
    );
    if (!user) {
      if (await joinus(req, userData)) {
        return tryLogin(req, res, userData, redirectOrigin, redirectPath);
      } else {
        const redirectUrl = new URL("/login/fail", redirectOrigin).href;
        res.redirect(redirectUrl);
        return;
      }
    }
    if (
      user.name !== userData.name ||
      user.email !== userData.email ||
      user.subinfo!.kaist !== userData.kaist
    ) {
      await update(userData);
      logger.info(
        `Past user info: ${user.id} ${user.name} ${user.email} ${
          user.subinfo!.kaist
        }`
      );
      return tryLogin(req, res, userData, redirectOrigin, redirectPath);
    }

    if (req.session.isApp) {
      const { token: accessToken } = await jwt.sign({
        id: user._id.toString(),
        type: "access",
      });
      const { token: refreshToken } = await jwt.sign({
        id: user._id.toString(),
        type: "refresh",
      });
      req.session.accessToken = accessToken;
      req.session.refreshToken = refreshToken;
    }

    login(req, userData.sid, user.id, user._id.toString(), user.name);

    res.redirect(new URL(redirectPath, redirectOrigin).href);
  } catch (err) {
    logger.error(err);
    const redirectUrl = new URL("/login/fail", redirectOrigin).href;
    res.redirect(redirectUrl);
  }
};

export const sparcsssoHandler = (req: Request, res: Response) => {
  const redirectPath = decodeURIComponent(
    (req.query?.redirect as string) || "%2F"
  );
  const isApp = !!req.query.isApp;
  const { url, state } = ssoClient!.getLoginParams();

  req.session.loginAfterState = {
    state: state,
    redirectOrigin: req.origin,
    redirectPath: redirectPath,
  };
  req.session.isApp = isApp;
  res.redirect(url + "&social_enabled=0&show_disabled_button=0");
};

export const sparcsssoCallbackHandler = (req: Request, res: Response) => {
  const loginAfterState = req.session?.loginAfterState;
  const { state: stateForCmp, code } = req.query;

  if (!loginAfterState)
    return res.status(400).send("Auth/sparcssso/callback : invalid request");

  const { state, redirectOrigin, redirectPath } = loginAfterState;
  req.session.loginAfterState = undefined;

  if (!state || !redirectOrigin || !redirectPath) {
    return res.status(400).send("Auth/sparcssso/callback : invalid request");
  }

  if (state !== stateForCmp) {
    logger.info("Login denied: state mismatch");

    const redirectUrl = new URL("/login/fail", redirectOrigin).href;
    return res.redirect(redirectUrl);
  }

  ssoClient!.getUserInfo(code).then((userDataBefore) => {
    const userData: userDataType & { name: any; kaist: any } =
      transUserData(userDataBefore);
    const isTestAccount = testAccounts?.includes(userData.email);
    if (userData.isEligible || nodeEnv !== "production" || isTestAccount) {
      tryLogin(req, res, userData, redirectOrigin, redirectPath);
    } else {
      // 카이스트 구성원이 아닌 경우, SSO 로그아웃 이후, 로그인 실패 URI 로 이동합니다
      const { id, sid, kaist, kaistType } = userData;
      logger.info(
        `Login denied: not a KAIST member (uid: ${id}, sid: ${sid}, kaist: ${kaist}, kaistType: ${kaistType})`
      );

      const redirectUrl = new URL("/login/fail", redirectOrigin).href;
      const ssoLogoutUrl = ssoClient!.getLogoutUrl(sid, redirectUrl);
      res.redirect(ssoLogoutUrl);
    }
  });
};

export const loginReplaceHandler = (req: Request, res: Response) => {
  res.status(400).json({
    error: "Auth/login/replace : Bad Request",
  });
};

export const logoutHandler = async (req: Request, res: Response) => {
  const redirectPath = decodeURIComponent(
    (req.query?.redirect as string) || "%2F"
  );

  try {
    const { sid } = getLoginInfo(req);

    // DB에서 deviceToken 레코드를 삭제합니다.
    const deviceToken = req.session?.deviceToken;
    if (deviceToken) {
      await unregisterDeviceToken(deviceToken);
    }

    // 로그아웃 URL을 생성 및 반환
    const redirectUrl = new URL(redirectPath, req.origin).href;
    const ssoLogoutUrl = ssoClient!.getLogoutUrl(sid, redirectUrl);
    logout(req);
    res.json({ ssoLogoutUrl });
  } catch (e) {
    res.status(500).send("Auth/logout : internal server error");
  }
};
