import jwt, { type SignOptions } from "jsonwebtoken";
import { jwt as jwtConfig } from "@/loadenv";
import type { TaxiAppTokenPayload } from "@/types/jwt";

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
