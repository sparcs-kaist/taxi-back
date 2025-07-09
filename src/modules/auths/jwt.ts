import jwt, { type SignOptions } from "jsonwebtoken";
import { jwt as jwtConfig, oneApp as oneAppConfig } from "@/loadenv";
import type { PayloadForOneApp } from "@/types/jwt";

const { secretKey, option, TOKEN_EXPIRED, TOKEN_INVALID } = jwtConfig;
const { tokenSecretKey: secretKeyForOneApp, accessTokenExpiry } = oneAppConfig;

type TokenType = "access" | "refresh";

interface SignType {
  id: string;
  type: TokenType;
}

export const sign = async ({ id, type }: SignType) => {
  const payload = {
    id,
    type,
  };

  const options: SignOptions = { ...option };

  if (type === "refresh") {
    options.expiresIn = "30d";
  }
  if (type === "access") {
    options.expiresIn = "14d";
  }

  const result = {
    token: jwt.sign(payload, secretKey, options),
  };
  return result;
};

export const verify = async (token: string) => {
  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "jwt expired") {
        return TOKEN_EXPIRED;
      }
    }
    return TOKEN_INVALID;
  }
  return decoded;
};

export const signForOneApp = (payload: PayloadForOneApp) => {
  const options: SignOptions = {
    ...option,
    expiresIn: accessTokenExpiry,
  };
  const result = {
    accessToken: jwt.sign(payload, secretKeyForOneApp, options),
  };
  return result;
};

export const verifyForOneApp = (accessToken: string) => {
  try {
    return jwt.verify(accessToken, secretKeyForOneApp) as PayloadForOneApp;
  } catch (err) {
    if (err instanceof Error && err.message === "jwt expired") {
      return TOKEN_EXPIRED;
    }
    return TOKEN_INVALID;
  }
};
