import { oneApp as oneAppConfig } from "@/loadenv";
import logger from "@/modules/logger";

import base64url from "base64url";
import { sign, unsign } from "cookie-signature";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import * as oneAppJwt from "@/modules/auths/jwt.oneapp";
import tokenStore from "@/modules/stores/tokenStore";

import type { RequestHandler } from "express";
import type { OneAppTokenIssueBody } from "@/routes/docs/schemas/authSchema";
import type { OneAppTokenPayload } from "@/types/jwt";

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
    const { accessToken } = oneAppJwt.sign(tokenPayload as OneAppTokenPayload);
    const { refreshTokenId, refreshToken } = signRefreshToken();
    const { ssoInfo: signedSsoInfo } = oneAppJwt.signSsoInfo(ssoInfo);

    await tokenStore.insert(refreshTokenId, tokenPayload as OneAppTokenPayload);
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

    const { accessToken } = oneAppJwt.sign({ oid, uid });
    return res.json({ accessToken, refreshToken });
  } catch (e) {
    logger.error(e);
    return res.status(500).send("Auth/token/refresh : internal server error");
  }
};
