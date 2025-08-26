import { oneApp as oneAppConfig } from "@/loadenv";
import logger from "@/modules/logger";
import { userModel } from "@/modules/stores/mongo";

import base64url from "base64url";
import { sign, unsign } from "cookie-signature";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import * as oneAppJwt from "@/modules/auths/jwt.oneapp";
import tokenStore from "@/modules/stores/tokenStore";

import type { RequestHandler } from "express";
import type { OneAppTokenIssueBody } from "@/routes/docs/schemas/authSchema";

const signRefreshToken = () => {
  const refreshTokenId = uuidv4();
  const refreshToken = sign(refreshTokenId, oneAppConfig.secretKey);
  return { refreshTokenId, refreshToken };
};

const verifyRefreshToken = (refreshToken: string) => {
  const decoded = unsign(refreshToken, oneAppConfig.secretKey);
  if (decoded === false) return {};
  else return { refreshTokenId: decoded };
};

export const oneAppTokenIssueHandler: RequestHandler = async (req, res) => {
  try {
    const { codeVerifier } = req.body as OneAppTokenIssueBody;
    if (!req.session.oneAppLoginState) {
      return res.status(400).send("Auth/token/issue : invalid request");
    } else if (
      !crypto.timingSafeEqual(
        crypto
          .createHash("sha256")
          .update(base64url.toBuffer(codeVerifier))
          .digest(),
        base64url.toBuffer(req.session.oneAppLoginState.codeChallenge)
      )
    ) {
      return res.status(400).send("Auth/token/issue : invalid request");
    }

    const { oid, uid, ssoInfo, time } = req.session.oneAppLoginState;
    req.session.oneAppLoginState = undefined;
    req.session.destroy((e) => e && logger.error(e));

    if (!oid || req.timestamp! - time >= 5 * 60 * 1000) {
      // 로그인을 완료한 후 5분이 경과한 경우 토큰을 발급할 수 없습니다.
      return res.status(400).send("Auth/token/issue : invalid request");
    }

    const tokenPayload = { oid, uid };
    const { accessToken } = oneAppJwt.sign(tokenPayload);
    const { refreshTokenId, refreshToken } = signRefreshToken();
    const { ssoInfo: signedSsoInfo } = oneAppJwt.signSsoInfo(ssoInfo);

    await tokenStore.insert(refreshTokenId, tokenPayload);
    logger.info(`Tokens for ${uid} issued successfully`);
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
    if (!oid) {
      return res.status(403).send("Auth/token/refresh : invalid refresh token");
    }

    const user = await userModel.exists({ _id: oid, withdraw: false });
    if (!user) {
      // 원앱 로그인 후 Taxi에서 탈퇴한 경우
      logger.info(`Tokens for ${uid} not refreshed: user not found`);
      return res.status(403).send("Auth/token/refresh : user not found");
    }

    const { accessToken } = oneAppJwt.sign({ oid, uid });
    logger.info(`Tokens for ${uid} refreshed successfully`);
    return res.json({ accessToken, refreshToken });
  } catch (e) {
    logger.error(e);
    return res.status(500).send("Auth/token/refresh : internal server error");
  }
};
