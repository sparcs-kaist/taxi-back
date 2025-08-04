import jwt, { type SignOptions } from "jsonwebtoken";
import { jwt as jwtConfig } from "@/loadenv";

const { secretKey, option, TOKEN_EXPIRED, TOKEN_INVALID } = jwtConfig;

interface Payload {
  id: string;
  type: "access" | "refresh";
}

export const sign = ({ id, type }: Payload) => {
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
    return jwt.verify(token, secretKey) as Payload;
  } catch (err) {
    if (err instanceof Error && err.message === "jwt expired") {
      return TOKEN_EXPIRED;
    }
    return TOKEN_INVALID;
  }
};
