import jwt, { type SignOptions } from "jsonwebtoken";
import { jwt as jwtConfig, oneApp as oneAppConfig } from "@/loadenv";
import type { OneAppTokenPayload } from "@/types/jwt";
import type { SparcsssoUserData } from "@/types/sparcssso";

const { option, TOKEN_EXPIRED, TOKEN_INVALID } = jwtConfig;
const { secretKey } = oneAppConfig;

export const sign = (payload: OneAppTokenPayload) => {
  const options: SignOptions = {
    ...option,
    expiresIn: "1h",
  };
  const result = {
    accessToken: jwt.sign({ ...payload, type: "access" }, secretKey, options),
  };
  return result;
};

export const verify = (accessToken: string) => {
  try {
    const { oid, uid, type } = jwt.verify(
      accessToken,
      secretKey
    ) as OneAppTokenPayload & { type?: "access" };
    // oid가 없는 토큰은 Taxi에서는 사용할 수 없습니다.
    if (type !== "access" || !oid) {
      return TOKEN_INVALID;
    }
    return { oid, uid };
  } catch (err) {
    if (err instanceof Error && err.message === "jwt expired") {
      return TOKEN_EXPIRED;
    }
    return TOKEN_INVALID;
  }
};

export const signSsoInfo = (userData: SparcsssoUserData) => {
  const options: SignOptions = {
    ...option,
    expiresIn: "5m",
  };
  // sid는 Taxi에서만 유효하기 때문에 payload에 포함하지 않습니다.
  const { sid, ...payload } = userData;
  const result = {
    ssoInfo: jwt.sign(payload, secretKey, options),
  };
  return result;
};
