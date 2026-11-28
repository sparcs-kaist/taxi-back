import type { Request, RequestHandler } from "express";
import type { Socket } from "socket.io";
import { jwt as jwtConfig } from "@/loadenv";
import * as jwt from "@/modules/auths/jwt";
import { userModel } from "@/modules/stores/mongo";
import { getBearerToken } from "@/modules/auths/login";

type BuddyAuthResult =
  /** Buddy 토큰이 아님. 다른 인증 방식으로 넘깁니다. */
  | { status: "none" }
  /** 서명은 유효하지만 만료된 Buddy 토큰. 앱이 토큰을 갱신하도록 401을 반환합니다. */
  | { status: "expired" }
  /** 유효한 Buddy 토큰이지만 uid에 해당하는 택시 회원이 없음. */
  | { status: "unknownUser" }
  | { status: "ok"; loginInfo: { id: string; oid: string } };

/**
 * 요청의 Bearer 토큰이 Buddy access token이면 검증하고 택시 회원을 조회합니다.
 * Express 요청과 socket.io 핸드셰이크 요청에서 함께 사용합니다.
 */
export const authenticateBuddyRequest = async (
  req: Request
): Promise<BuddyAuthResult> => {
  const token = getBearerToken(req);
  if (!token) return { status: "none" };

  const payload = jwt.verifyBuddyToken(token);
  if (payload === jwtConfig.TOKEN_EXPIRED) return { status: "expired" };
  if (!payload) return { status: "none" };

  const user = await userModel.findOne(
    { id: payload.uid, withdraw: false },
    "_id"
  );
  if (!user) return { status: "unknownUser" };

  return {
    status: "ok",
    loginInfo: { id: payload.uid, oid: user.get("_id").toString() },
  };
};

const buddyTokenMiddleware: RequestHandler = async (req, res, next) => {
  if (req.path === "/admin" || req.path.startsWith("/admin/")) {
    return next();
  }
  // 아직 택시 회원이 없는 사용자도 호출하므로, 핸들러가 토큰을 직접 검증합니다.
  if (req.path === "/auth/buddy/bootstrap") {
    return next();
  }

  try {
    const result = await authenticateBuddyRequest(req);
    switch (result.status) {
      case "expired":
        return res.status(401).json({ error: "token expired" });
      case "unknownUser":
        return res.status(401).json({ error: "unauthorized" });
      case "ok":
        req.buddyLoginInfo = result.loginInfo;
        return next();
      default:
        return next();
    }
  } catch (error) {
    return next(error);
  }
};

/**
 * socket.io 연결 시 Buddy 토큰을 검증합니다.
 * Express 미들웨어(app.use)는 socket.io 핸드셰이크에서 실행되지 않으므로 별도로 등록합니다.
 * 성공하면 connection 핸들러의 getLoginInfo가 req.buddyLoginInfo를 사용하고,
 * 만료되었거나 회원이 없으면 connect_error(data.status = 401)로 연결을 거부합니다.
 */
export const buddySocketMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  const req = socket.request as Request;
  try {
    const result = await authenticateBuddyRequest(req);
    switch (result.status) {
      case "expired":
      case "unknownUser": {
        const error = new Error(
          result.status === "expired" ? "token expired" : "unauthorized"
        ) as Error & { data?: { status: number } };
        error.data = { status: 401 };
        return next(error);
      }
      case "ok":
        req.buddyLoginInfo = result.loginInfo;
        return next();
      default:
        return next();
    }
  } catch (error) {
    return next(error as Error);
  }
};

export default buddyTokenMiddleware;
