import { type Request } from "express";
import config from "@/loadenv";
import logger from "@/modules/logger";

export interface LoginInfo {
  id: string;
  sid: string;
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
    if (timeFlow > config.session.expiry) {
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
  sid: string,
  id: string,
  oid: string,
  name: string
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
