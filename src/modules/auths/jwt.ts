import jwt, { type SignOptions } from "jsonwebtoken";
import {
  buddyJwtIssuer,
  jwt as jwtConfig,
  oneApp as oneAppConfig,
} from "@/loadenv";
import type { BuddyTokenPayload, TaxiAppTokenPayload } from "@/types/jwt";

const { secretKey, option, TOKEN_EXPIRED, TOKEN_INVALID } = jwtConfig;

export const sign = ({ id, type }: TaxiAppTokenPayload) => {
  const payload = { id, type };
  const options: SignOptions = {
    ...option,
    expiresIn: type === "refresh" ? "30d" : "14d",
  };
  const result = {
    token: jwt.sign(payload, secretKey, options),
  };
  return result;
};

export const verify = (token: string) => {
  try {
    return jwt.verify(token, secretKey) as TaxiAppTokenPayload;
  } catch (err) {
    if (err instanceof Error && err.message === "jwt expired") {
      return TOKEN_EXPIRED;
    }
    return TOKEN_INVALID;
  }
};

/**
 * Buddy access token을 검증합니다.
 * Buddy 토큰은 원앱 토큰과 같은 ONEAPP_TOKEN_SECRET으로 서명되므로 oneApp.secretKey로 검증합니다.
 * 서명과 issuer가 유효하지만 만료된 Buddy 토큰은 TOKEN_EXPIRED를 반환합니다.
 * 앱은 401을 받아야 Buddy에서 토큰을 갱신하므로, 만료를 다른 실패와 구분합니다.
 */
export const verifyBuddyToken = (
  token: string
): BuddyTokenPayload | typeof TOKEN_EXPIRED | undefined => {
  try {
    const payload = jwt.verify(token, oneAppConfig.secretKey, {
      algorithms: [option.algorithm],
      issuer: buddyJwtIssuer,
      ignoreExpiration: true,
    });
    if (
      typeof payload === "string" ||
      typeof payload.uid !== "string" ||
      payload.uid.length === 0 ||
      payload.type !== "access" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number" ||
      typeof payload.iss !== "string" ||
      payload.iss.length === 0 ||
      "oid" in payload ||
      "id" in payload
    ) {
      return undefined;
    }
    if (Math.floor(Date.now() / 1000) >= payload.exp) {
      return TOKEN_EXPIRED;
    }

    return {
      uid: payload.uid,
      type: "access",
      iat: payload.iat,
      exp: payload.exp,
      iss: payload.iss,
    };
  } catch {
    return undefined;
  }
};

/**
 * Buddy 로그인 응답의 ssoInfo JWT를 검증하고 payload를 반환합니다.
 * access token과 같은 키와 issuer로 서명되며, type이 "sso_info"이고 수명은 5분입니다.
 * 만료되었거나 유효하지 않으면 undefined를 반환합니다. payload의 형태는 호출하는 쪽에서 검증합니다.
 */
export const verifyBuddySsoInfo = (
  token: string
): Record<string, unknown> | undefined => {
  try {
    const payload = jwt.verify(token, oneAppConfig.secretKey, {
      algorithms: [option.algorithm],
      issuer: buddyJwtIssuer,
    });
    if (typeof payload === "string" || payload.type !== "sso_info") {
      return undefined;
    }
    return payload;
  } catch {
    return undefined;
  }
};
