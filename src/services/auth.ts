import type { Request, Response, RequestHandler } from "express";
import { nodeEnv, testAccounts } from "@/loadenv";
import { userModel } from "@/modules/stores/mongo";

import patterns from "@/modules/patterns";
const { user: userPattern } = patterns;
import { SparcsssoQuery, LogoutQuery } from "@/routes/docs/schemas/authSchema";

import { ssoClient, getLoginInfo, logout, login } from "@/modules/auths/login";

import { unregisterDeviceToken } from "@/modules/fcm";
import {
  generateNickname,
  generateProfileImageUrl,
  getFullUsername,
} from "@/modules/modifyProfile";
import * as jwt from "@/modules/auths/jwt";
import logger from "@/modules/logger";

interface UserDataType {
  email: string;
  id: string;
  sid: string;
  uid?: string;
  name: string;
  nickname?: string;
  kaist: string;
  kaistType?: string;
  kaist_info?: string;
  sparcs: string;
  facebook: string;
  twitter: string;
  first_name?: string;
  last_name?: string;
  isEligible?: boolean;
}

interface RawUserType {
  uid: string;
  sid: string;
  kaist_info?: string;
  kaist_v2_info?: string;
  first_name: string;
  last_name: string;
  facebook_id?: string;
  twitter_id?: string;
  sparcs_id?: string;
  email?: string;
}

interface KaistInfoV1 {
  ku_std_no?: string;
  employeeType?: string;
  mail?: string;
}

interface KaistInfoV2 {
  std_no?: string;
  socps_cd?: string;
  email?: string;
}

const transKaistInfo = (userData: RawUserType) => {
  const kaistInfo = userData.kaist_info
    ? (JSON.parse(userData.kaist_info) as KaistInfoV1)
    : {};
  const kaistInfoV2 = userData.kaist_v2_info
    ? (JSON.parse(userData.kaist_v2_info) as KaistInfoV2)
    : {};
  return {
    kaist: kaistInfoV2.std_no || kaistInfo.ku_std_no || "", // 학번 (직원인 경우 빈 문자열)
    kaistType: kaistInfoV2.socps_cd || kaistInfo.employeeType || "", // 구성원 유형
    email: kaistInfoV2.email || kaistInfo.mail || "", // 학교 이메일 주소
  };
};

const transUserData = (userData: RawUserType) => {
  const kaistInfo = transKaistInfo(userData);

  // info.isEligible: 카이스트 구성원인지 여부
  const info = {
    id: userData.uid,
    sid: userData.sid,
    name: getFullUsername(userData.first_name, userData.last_name),
    facebook: userData.facebook_id || "",
    twitter: userData.twitter_id || "",
    kaist: kaistInfo.kaist,
    kaistType: kaistInfo.kaistType, // DB에 저장하지 않음
    sparcs: userData.sparcs_id || "",
    email: kaistInfo.email || userData.email || "",
    isEligible: userPattern.allowedEmployeeTypes.test(kaistInfo.kaistType), // DB에 저장하지 않음
  };
  return info;
};

const joinus = async (req: Request, userData: UserDataType) => {
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
    if (req.timestamp === undefined) {
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
  name: string;
  email: string;
  kaist: string;
  id: string;
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
  userData: UserDataType,
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
        return res.redirect(redirectUrl);
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

    login(req, user.id, user._id.toString(), userData.sid);

    res.redirect(new URL(redirectPath, redirectOrigin).href);
  } catch (err) {
    logger.error(err);
    const redirectUrl = new URL("/login/fail", redirectOrigin).href;
    res.redirect(redirectUrl);
  }
};

export const sparcsssoHandler: RequestHandler = (req, res) => {
  const { redirect, isApp }: SparcsssoQuery = req.query;
  const redirectPath = decodeURIComponent(redirect || "%2F");

  const { url, state } = ssoClient!.getLoginParams() as {
    url: string;
    state: string;
  };

  req.session.loginAfterState = {
    state: state,
    redirectOrigin: req.origin,
    redirectPath: redirectPath,
  };
  req.session.isApp = isApp;
  res.redirect(url + "&social_enabled=0&show_disabled_button=0");
};

export const sparcsssoCallbackHandler: RequestHandler = (req, res) => {
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
    logger.info(`Login requested: ${JSON.stringify(userDataBefore)}`);

    const userData = transUserData(userDataBefore);
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

export const loginReplaceHandler: RequestHandler = (req, res) => {
  res.status(400).json({
    error: "Auth/login/replace : Bad Request",
  });
};

export const logoutHandler: RequestHandler = async (req, res) => {
  const { redirect }: LogoutQuery = req.query;
  const redirectPath = decodeURIComponent(redirect || "%2F");

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
