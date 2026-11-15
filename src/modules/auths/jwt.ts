import jwt, { type SignOptions } from "jsonwebtoken";
import { buddyJwtIssuer, jwt as jwtConfig } from "@/loadenv";
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

export const verifyBuddyToken = (
  token: string
): BuddyTokenPayload | undefined => {
  try {
    const payload = jwt.verify(token, secretKey, {
      algorithms: [option.algorithm],
      issuer: buddyJwtIssuer,
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
