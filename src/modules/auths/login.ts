import type { Request } from "express";
import {
  session as sessionConfig,
  sparcssso as sparcsssoEnv,
  jwt as jwtConfig,
} from "@/loadenv";
import logger from "@/modules/logger";
import * as oneAppJwt from "@/modules/auths/jwt.oneapp";
import SsoClient from "./sparcssso";

const { TOKEN_EXPIRED, TOKEN_INVALID } = jwtConfig;

// 환경변수 SPARCSSSO_CLIENT_ID 유무에 따라 로그인 방식이 변경됩니다.
export const isAuthReplace = !sparcsssoEnv.id;
export const ssoClient = !isAuthReplace
  ? new SsoClient(sparcsssoEnv.id, sparcsssoEnv.key)
  : undefined;

export interface LoginInfo {
  id: string;
  sid?: string;
  oid: string;
  time: number;
}

export const getBearerToken = (req: Request) => {
  const parts = req.headers.authorization?.split(" ");
  if (parts && parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  } else {
    return undefined;
  }
};

export const getLoginInfo = (req: Request) => {
  const accessTokenForOneApp = getBearerToken(req);
  if (accessTokenForOneApp) {
    const decoded = oneAppJwt.verify(accessTokenForOneApp);
    if (decoded === TOKEN_EXPIRED || decoded === TOKEN_INVALID) {
      return {};
    }
    const { oid, uid } = decoded;
    return { id: uid, oid };
  } else if (req.session.loginInfo) {
    const { id, sid, oid, time } = req.session.loginInfo;
    const timeFlow = Date.now() - time;
    // 14일이 지난 세션에 대해서는 로그인 정보를 반환하지 않습니다.
    // 세션은 새로운 요청 시 갱신되지 않습니다.
    if (timeFlow > sessionConfig.expiry) {
      return {};
    }
    return { id, sid, oid };
  }
  return {};
};

export const isLogin = (req: Request) => {
  const loginInfo = getLoginInfo(req);
  if (loginInfo.id) return true;
  return false;
};

export const login = (req: Request, id: string, oid: string, sid?: string) => {
  req.session.loginInfo = { sid, id, oid, time: Date.now() };
};

export const logout = (req: Request) => {
  // 로그아웃 전 socket.io 소켓들 연결부터 끊기
  const io = req.app.get("io");
  if (io) {
    const accessTokenForOneApp = getBearerToken(req);
    if (accessTokenForOneApp) {
      io.in(`token-${accessTokenForOneApp}`).disconnectSockets(true);
    } else {
      io.in(`session-${req.session.id}`).disconnectSockets(true);
    }
  }

  req.session.destroy((err) => {
    if (err) logger.error(err);
  });
};
