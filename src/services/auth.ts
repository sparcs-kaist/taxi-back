import { nodeEnv, testAccounts, oneApp as oneAppConfig } from "@/loadenv";
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
  OneAppTokenIssueBody,
} from "@/routes/docs/schemas/authSchema";

import base64url from "base64url";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { sign, unsign } from "cookie-signature";
import tokenStore from "@/modules/stores/tokenStore";
import type { PayloadForOneApp } from "@/types/jwt";

const { user: userPattern } = patterns;

type UserData = ReturnType<typeof transUserData>;

interface RawUserData {
  uid: string;
  sid: string;
  kaist_info: string | null;
  kaist_v2_info: string | null;
  first_name: string;
  last_name: string;
  facebook_id: string | null;
  twitter_id: string | null;
  sparcs_id: string | null;
  email: string;
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

const transKaistInfo = (userData: RawUserData) => {
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

export const transUserData = (userData: RawUserData) => {
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
  if (oldUser && oldUser.withdrewAt) {
    // 탈퇴 후 7일이 지나지 않았을 경우, 가입을 거부합니다.
    const diff = req.timestamp! - oldUser.withdrewAt.getTime();
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      logger.info(
        `Login denied: recently withdrawn user (uid: ${userData.id}, sid: ${userData.sid})`
      );
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
  userDataBefore: RawUserData,
  userData: UserData,
  redirectOrigin: string,
  redirectPath: string
): Promise<void> => {
  const { id: uid, sid } = userData;
  const isOneApp = !!req.session?.oneAppState;

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
      return grantLoginOnlyForOneApp(
        req,
        res,
        undefined,
        uid,
        sid,
        userDataBefore,
        redirectOrigin
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
      return grantLoginOnlyForOneApp(
        req,
        res,
        user._id.toString(),
        uid,
        sid,
        userDataBefore,
        redirectOrigin
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
    return res.redirect(new URL(redirectPath, redirectOrigin).href);
  } catch (err) {
    logger.error(err);
    return denyLogin(
      res,
      isOneApp,
      undefined,
      redirectOrigin,
      500,
      "internal server error"
    );
  }
};

const denyLogin = (
  res: Response,
  isOneApp: boolean,
  sid: string | undefined,
  redirectOrigin: string,
  code: number,
  description: string
) => {
  if (isOneApp) {
    const encodedDescription = encodeURIComponent(description);
    return res.redirect(
      `sparcsapp://error?code=${code}&description=${encodedDescription}`
    );
  } else {
    const redirectUrl = new URL("/login/fail", redirectOrigin).href;
    const ssoLogoutUrl = sid && ssoClient?.getLogoutUrl(sid, redirectUrl);
    return res.redirect(ssoLogoutUrl ?? redirectUrl);
  }
};

const grantLoginOnlyForOneApp = (
  req: Request,
  res: Response,
  oid: string | undefined,
  uid: string,
  sid: string | undefined,
  userDataBefore: RawUserData,
  redirectOrigin: string
) => {
  if (req.session.oneAppState) {
    // 원앱에서 로그인하는 경우 토큰 발급을 위해 세션에 정보를 저장합니다.
    // oid가 없는 토큰은 다른 서비스에서의 인증 용도로 발급하는 것이며, Taxi에서는 사용할 수 없습니다.
    req.session.oneAppState = {
      ...req.session.oneAppState,
      oid,
      uid,
      ssoInfo: userDataBefore,
    };
    return res.redirect(
      "sparcsapp://authorize?session=" +
        encodeURIComponent(req.cookies["connect.sid"])
    );
  } else {
    // 웹에서 로그인하는 경우 로그인 실패 화면으로 이동합니다.
    const redirectUrl = new URL("/login/fail", redirectOrigin).href;
    const ssoLogoutUrl = ssoClient?.getLogoutUrl(sid, redirectUrl);
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
  res.redirect(url + "&social_enabled=0&show_disabled_button=0");
};

export const sparcsssoCallbackHandler: RequestHandler = (req, res) => {
  const loginAfterState = req.session?.loginAfterState;
  const isOneApp = !!req.session?.oneAppState;
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
    logger.info(`Login denied: state mismatch`);
    denyLogin(
      res,
      isOneApp,
      undefined,
      redirectOrigin!,
      400,
      "invalid request"
    ); // FIXME: redirectOrigin can be undefined
    return;
  }

  ssoClient!.getUserInfo(code).then((userDataBefore: RawUserData) => {
    logger.info(`Login requested: ${JSON.stringify(userDataBefore)}`);
    const { kaist_v2_info: kaistInfoV2 } = userDataBefore;

    const userData = transUserData(userDataBefore);
    const isTestAccount = testAccounts?.includes(userData.email);
    if (userData.isEligible || nodeEnv !== "production" || isTestAccount) {
      tryLogin(
        req,
        res,
        userDataBefore,
        userData,
        redirectOrigin!, // FIXME: redirectOrigin can be undefined
        redirectPath! // FIXME: redirectPath can be undefined
      );
      return;
    }

    // 카이스트 구성원이 아닌 경우 Taxi를 사용할 수 없습니다.
    const { id: uid, sid } = userData;
    logger.info(`Login denied: not a KAIST member (uid: ${uid}, sid: ${sid})`);

    if (kaistInfoV2) {
      return grantLoginOnlyForOneApp(
        req,
        res,
        undefined,
        uid,
        sid,
        userDataBefore,
        redirectOrigin! // FIXME: redirectOrigin can be undefined
      );
    }

    // 카이스트 정보가 없는 경우 원앱을 사용할 수 없습니다.
    denyLogin(res, isOneApp, sid, redirectOrigin!, 403, "no KAIST information"); // FIXME: redirectOrigin can be undefined
  });
};

export const loginReplaceHandler: RequestHandler = (req, res) => {
  res.status(400).json({
    error: "Auth/login/replace : Bad Request",
  });
};

export const logoutHandler: RequestHandler = async (req, res) => {
  const { redirect } = req.query as LogoutQuery;
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

export const oneAppLoginHandler: RequestHandler = (req, res) => {
  const { codeChallenge } = req.query as OneAppLoginQuery;
  const { url, state } = ssoClient!.getLoginParams();

  req.session.loginAfterState = { state };
  req.session.isApp = false;
  req.session.oneAppState = { codeChallenge };
  res.redirect(url + "&social_enabled=0&show_disabled_button=0");
};

export const oneAppTokenIssueHandler: RequestHandler = async (req, res) => {
  try {
    const { codeVerifier } = req.body as OneAppTokenIssueBody;
    if (!req.session.oneAppState) {
      return res.status(400).send("Auth/token/issue : invalid request");
    } else if (
      !crypto.timingSafeEqual(
        crypto
          .createHash("sha256")
          .update(base64url.toBuffer(codeVerifier))
          .digest(),
        base64url.toBuffer(req.session.oneAppState.codeChallenge)
      )
    ) {
      return res.status(400).send("Auth/token/issue : invalid request");
    }

    const { oid, uid, ssoInfo } = req.session.oneAppState;
    req.session.oneAppState = undefined;
    req.session.destroy((e) => e && logger.error(e));

    const tokenPayload = { oid, uid };
    const { accessToken } = jwt.signForOneApp(tokenPayload as PayloadForOneApp);
    const { refreshTokenId, refreshToken } = signRefreshToken();
    const { signedSsoInfo } = jwt.signSsoInfo(ssoInfo);

    await tokenStore.insert(refreshTokenId, tokenPayload as PayloadForOneApp);
    return res.json({ accessToken, refreshToken, ssoInfo: signedSsoInfo });
  } catch (e) {
    logger.error(e);
    return res.status(500).send("Auth/token/issue : internal server error");
  }
};

export const oneAppTokenRefreshHandler: RequestHandler = async (req, res) => {
  try {
    const { refreshTokenId: oldRefreshTokenId } = verifyRefreshToken(
      req.body.refreshToken
    );
    if (!oldRefreshTokenId) {
      return res.status(400).send("Auth/token/refresh : invalid refresh token");
    }

    const { refreshTokenId, refreshToken } = signRefreshToken();
    const { oid, uid } = await tokenStore.update(
      oldRefreshTokenId,
      refreshTokenId
    );
    if (!oid || !uid) {
      return res.status(403).send("Auth/token/refresh : invalid refresh token");
    }

    const { accessToken } = jwt.signForOneApp({ oid, uid });
    return res.json({ accessToken, refreshToken });
  } catch (e) {
    return res.status(500).send("Auth/token/refresh : internal server error");
  }
};

const signRefreshToken = () => {
  const refreshTokenId = uuidv4();
  const refreshToken = sign(refreshTokenId, oneAppConfig.tokenSecretKey);
  return { refreshTokenId, refreshToken };
};

const verifyRefreshToken = (refreshToken: string) => {
  const decoded = unsign(refreshToken, oneAppConfig.tokenSecretKey);
  if (decoded === false) return {};
  else return { refreshTokenId: decoded };
};
