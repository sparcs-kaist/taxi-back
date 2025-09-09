import { nodeEnv, testAccounts } from "@/loadenv";
import logger from "@/modules/logger";
import patterns from "@/modules/patterns";
import { userModel } from "@/modules/stores/mongo";

import * as jwt from "@/modules/auths/jwt";
import { ssoClient, getLoginInfo, logout, login } from "@/modules/auths/login";
import { unregisterDeviceToken } from "@/modules/fcm";
import {
  generateNickname,
  generateProfileImageUrl,
  getFullUsername,
} from "@/modules/modifyProfile";

import type { Request, Response, RequestHandler } from "express";
import type {
  SparcsssoQuery,
  LogoutQuery,
  OneAppLoginQuery,
} from "@/routes/docs/schemas/authSchema";
import type { SparcsssoUserData } from "@/types/sparcssso";

const { user: userPattern } = patterns;

type UserData = ReturnType<typeof transUserData>;

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

const transKaistInfo = (userData: SparcsssoUserData) => {
  const kaistInfoV1: KaistInfoV1 = userData.kaist_info
    ? JSON.parse(userData.kaist_info)
    : {};
  const kaistInfoV2: KaistInfoV2 = userData.kaist_v2_info
    ? JSON.parse(userData.kaist_v2_info)
    : {};
  return {
    kaist: kaistInfoV2.std_no || kaistInfoV1.ku_std_no || "", // 학번 (직원인 경우 빈 문자열)
    kaistType: kaistInfoV2.socps_cd || kaistInfoV1.employeeType || "", // 구성원 유형
    email: kaistInfoV2.email || kaistInfoV1.mail || "", // 학교 이메일 주소
  };
};

export const transUserData = (userData: SparcsssoUserData) => {
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
    email: kaistInfo.email || userData.email,
    isEligible: userPattern.allowedEmployeeTypes.test(kaistInfo.kaistType), // DB에 저장하지 않음
  };
  return info;
};

const joinus = async (req: Request, userData: UserData) => {
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
  if (
    oldUser?.withdrewAt &&
    req.timestamp! - oldUser.withdrewAt.getTime() < 7 * 24 * 60 * 60 * 1000
  ) {
    // 탈퇴 후 7일이 지나지 않았을 경우, 가입을 거부합니다.
    return false;
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

const update = async (userData: UserData) => {
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
  userDataBefore: SparcsssoUserData,
  userData: UserData,
  redirectOrigin: string | undefined,
  redirectPath: string | undefined
): Promise<void> => {
  const { id: uid } = userData;
  const isOneApp = !!req.session.oneAppLoginState;

  try {
    const user = await userModel.findOne(
      { id: uid, withdraw: false }, // NOTE: SSO uid 쓰는 곳
      "_id name email subinfo id withdraw ban"
    );
    if (!user) {
      if (await joinus(req, userData)) {
        return tryLogin(
          req,
          res,
          userDataBefore,
          userData,
          redirectOrigin,
          redirectPath
        );
      }
      // 회원가입이 거절된 경우 Taxi를 사용할 수 없습니다.
      return denyLogin(
        res,
        isOneApp,
        userData,
        redirectOrigin,
        403,
        "registration denied"
      );
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
      return tryLogin(
        req,
        res,
        userDataBefore,
        userData,
        redirectOrigin,
        redirectPath
      );
    }

    if (isOneApp) {
      // 원앱에서 로그인하는 경우 토큰 발급을 위해 세션에 정보를 저장합니다.
      req.session.oneAppLoginState = {
        ...req.session.oneAppLoginState!,
        oid: user._id.toString(),
        uid,
        ssoInfo: userDataBefore,
        time: req.timestamp!,
      };
      logger.info(`Tokens for ${uid} are ready to be issued`);
      return res.redirect(
        "sparcsapp://authorize?session=" +
          encodeURIComponent(req.cookies["connect.sid"])
      );
    } else if (req.session.isApp) {
      const { token: accessToken } = jwt.sign({
        id: user._id.toString(),
        type: "access",
      });
      const { token: refreshToken } = jwt.sign({
        id: user._id.toString(),
        type: "refresh",
      });
      req.session.accessToken = accessToken;
      req.session.refreshToken = refreshToken;
    }

    login(req, user.id, user._id.toString(), userData.sid);
    return res.redirect(new URL(redirectPath!, redirectOrigin).href);
  } catch (err) {
    logger.error(err);
    return denyLogin(
      res,
      isOneApp,
      userData,
      redirectOrigin,
      500,
      "internal server error"
    );
  }
};

const denyLogin = (
  res: Response,
  isOneApp: boolean,
  userData: UserData | undefined,
  redirectOrigin: string | undefined,
  code: number,
  description: string
) => {
  logger.info(
    `Login denied: ${description} (uid: ${userData?.id}, sid: ${userData?.sid})`
  );
  if (isOneApp) {
    const encodedDescription = encodeURIComponent(description);
    return res.redirect(
      `sparcsapp://error?code=${code}&description=${encodedDescription}`
    );
  } else {
    const redirectUrl = new URL("/login/fail", redirectOrigin).href;
    const ssoLogoutUrl =
      userData?.sid && ssoClient?.getLogoutUrl(userData.sid, redirectUrl);
    return res.redirect(ssoLogoutUrl ?? redirectUrl);
  }
};

export const sparcsssoHandler: RequestHandler = (req, res) => {
  const { redirect, isApp } = req.query as unknown as SparcsssoQuery;
  const redirectPath = decodeURIComponent(redirect || "%2F");
  const { url, state } = ssoClient!.getLoginParams();

  req.session.loginAfterState = {
    state: state,
    redirectOrigin: req.origin,
    redirectPath: redirectPath,
  };
  req.session.isApp = isApp;

  return res.redirect(url + "&social_enabled=0&show_disabled_button=0");
};

export const sparcsssoCallbackHandler: RequestHandler = (req, res) => {
  const loginAfterState = req.session.loginAfterState;
  const isOneApp = !!req.session.oneAppLoginState;
  const { state: stateForCmp, code } = req.query;

  if (!loginAfterState) {
    return res.status(400).send("Auth/sparcssso/callback : invalid request");
  }

  const { state, redirectOrigin, redirectPath } = loginAfterState;
  req.session.loginAfterState = undefined;

  // 원앱에서 로그인하는 경우 redirectOrigin과 redirectPath가 없음
  if (!state || (!isOneApp && (!redirectOrigin || !redirectPath))) {
    return res.status(400).send("Auth/sparcssso/callback : invalid request");
  } else if (state !== stateForCmp) {
    denyLogin(res, isOneApp, undefined, redirectOrigin, 400, "state mismatch");
    return;
  }

  ssoClient!.getUserInfo(code).then((userDataBefore: SparcsssoUserData) => {
    logger.info(`Login requested: ${JSON.stringify(userDataBefore)}`);

    const userData = transUserData(userDataBefore);
    const isTestAccount = testAccounts?.includes(userData.email);
    if (userData.isEligible || nodeEnv !== "production" || isTestAccount) {
      return tryLogin(
        req,
        res,
        userDataBefore,
        userData,
        redirectOrigin,
        redirectPath
      );
    }

    // 카이스트 구성원이 아닌 경우 Taxi를 사용할 수 없습니다.
    return denyLogin(
      res,
      isOneApp,
      userData,
      redirectOrigin,
      403,
      "not a KAIST member"
    );
  });
};

export const loginReplaceHandler: RequestHandler = (req, res) => {
  return res.status(400).json({
    error: "Auth/login/replace : Bad Request",
  });
};

export const logoutHandler: RequestHandler = async (req, res) => {
  const { redirect } = req.query as LogoutQuery;
  const redirectPath = decodeURIComponent(redirect || "%2F");

  try {
    const { sid } = getLoginInfo(req);

    // DB에서 deviceToken 레코드를 삭제합니다.
    const deviceToken = req.session.deviceToken;
    if (deviceToken) {
      await unregisterDeviceToken(deviceToken);
    }

    // 로그아웃 URL을 생성 및 반환
    const redirectUrl = new URL(redirectPath, req.origin).href;
    const ssoLogoutUrl = sid && ssoClient?.getLogoutUrl(sid, redirectUrl);
    logout(req);
    return res.json({ ssoLogoutUrl: ssoLogoutUrl ?? redirectUrl });
  } catch (e) {
    logger.error(e);
    return res.status(500).send("Auth/logout : internal server error");
  }
};

export const oneAppLoginHandler: RequestHandler = (req, res) => {
  const { codeChallenge } = req.query as OneAppLoginQuery;
  const { url, state } = ssoClient!.getLoginParams();

  req.session.loginAfterState = { state };
  req.session.isApp = false;
  req.session.oneAppLoginState = { codeChallenge };

  return res.redirect(url + "&social_enabled=0&show_disabled_button=0");
};
