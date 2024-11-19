import jwt, { type SignOptions } from "jsonwebtoken";
import config from "@/loadenv";

const { secretKey, option, TOKEN_EXPIRED, TOKEN_INVALID } = config.jwt;

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
