import type { Request } from "express";
import { session as sessionConfig, sparcssso as sparcsssoEnv } from "@/loadenv";
import logger from "@/modules/logger";
import SsoClient from "./sparcssso";

// 환경변수 SPARCSSSO_CLIENT_ID 유무에 따라 로그인 방식이 변경됩니다.
export const isAuthReplace = !sparcsssoEnv.id;
export const ssoClient = !isAuthReplace
  ? new SsoClient(sparcsssoEnv.id, sparcsssoEnv.key)
  : undefined;

export interface LoginInfo {
  id: string;
  sid?: string;
  oid: string;
  name: string;
  time: number;
}

export const getLoginInfo = (req: Request) => {
  if (req.session.loginInfo) {
    const { id, sid, oid, name, time } = req.session.loginInfo;
    const timeFlow = Date.now() - time;
    // 14일이 지난 세션에 대해서는 로그인 정보를 반환하지 않습니다.
    // 세션은 새로운 요청 시 갱신되지 않습니다.
    if (timeFlow > sessionConfig.expiry) {
      return { id: undefined, sid: undefined, oid: undefined, name: undefined };
    }
    return { id, sid, oid, name };
  }
  return { id: undefined, sid: undefined, oid: undefined, name: undefined };
};

export const isLogin = (req: Request) => {
  const loginInfo = getLoginInfo(req);
  if (loginInfo.id) return true;
  return false;
};

export const login = (
  req: Request,
  id: string,
  oid: string,
  name: string,
  sid?: string
) => {
  req.session.loginInfo = { sid, id, oid, name, time: Date.now() };
};

export const logout = (req: Request) => {
  // 로그아웃 전 socket.io 소켓들 연결부터 끊기
  const io = req.app.get("io");
  if (io) io.in(`session-${req.session.id}`).disconnectSockets(true);

  req.session.destroy((err) => {
    if (err) logger.error(err);
  });
};
