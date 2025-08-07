import type { Request } from "express";
import type { Server } from "socket.io";
import {
  sparcssso as sparcsssoEnv,
  session as sessionConfig,
  jwt as jwtConfig,
} from "@/loadenv";
import logger from "@/modules/logger";
import * as oneAppJwt from "./jwt.oneapp";
import SsoClient from "./sparcssso";

const { TOKEN_EXPIRED, TOKEN_INVALID } = jwtConfig;

// 환경변수 SPARCSSSO_CLIENT_ID 유무에 따라 로그인 방식이 변경됩니다.
export const isAuthReplace = !sparcsssoEnv.id;
export const ssoClient = !isAuthReplace
  ? new SsoClient(sparcsssoEnv.id, sparcsssoEnv.key)
  : undefined;

export interface LoginInfo {
  /** SPARCS SSO에서 넘어온 uid. 불가피한 경우가 아니라면 사용 자제. */
  id: string;
  /** SPARCS SSO에서 넘어온 sid. 불가피한 경우가 아니라면 사용 자제. Taxi 플러터 앱이나 원앱 사용자의 경우 undefined. */
  sid: string | undefined;
  /** User Document의 ObjectId */
  oid: string;
  /** 로그인 시각 */
  time: number;
}

export const getBearerToken = (req: Request) => {
  const parts = req.headers.authorization?.split(" ");
  if (parts?.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  } else {
    return undefined;
  }
};

export const getLoginInfo = (req: Request) => {
  const bearerToken = getBearerToken(req);
  if (bearerToken) {
    const decoded = oneAppJwt.verify(bearerToken);
    if (decoded === TOKEN_EXPIRED || decoded === TOKEN_INVALID) {
      return { id: undefined, sid: undefined, oid: undefined };
    }
    const { oid, uid } = decoded;
    return oid ? { id: uid, oid } : {};
  }

  // req.session.destroy를 사용하면 req.session이 undefined가 됩니다.
  if (req.session?.loginInfo) {
    const { id, sid, oid, time } = req.session.loginInfo;
    const timeFlow = Date.now() - time;
    // 14일이 지난 세션에 대해서는 로그인 정보를 반환하지 않습니다.
    // 세션은 새로운 요청 시 갱신되지 않습니다.
    if (timeFlow > sessionConfig.expiry) {
      return { id: undefined, sid: undefined, oid: undefined };
    }
    return { id, sid, oid };
  }

  return { id: undefined, sid: undefined, oid: undefined };
};

export const isLogin = (req: Request) => {
  const loginInfo = getLoginInfo(req);
  if (loginInfo.id) return true;
  return false;
};

export const login = (req: Request, id: string, oid: string, sid?: string) => {
  req.session.loginInfo = { id, sid, oid, time: Date.now() };
};

export const logout = (req: Request) => {
  // 로그아웃 전 socket.io 소켓들 연결부터 끊기
  const io = req.app.get("io") as Server;
  if (io) {
    // 순환 참조로 인해 socket.ts 파일에 있는 getSessionRoom 함수를 사용할 수 없습니다.
    const bearerToken = getBearerToken(req);
    const sessionRoom = bearerToken
      ? `token-${bearerToken}`
      : `session-${req.session.id}`;
    io.in(sessionRoom).disconnectSockets(true);
  }

  req.session.destroy((err) => {
    if (err) logger.error(err);
  });
};
