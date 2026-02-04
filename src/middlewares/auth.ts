// 로그인된 상태에만 접근할 수 있는 라우터(rooms)를 위한 미들웨어입니다.
import type { RequestHandler } from "express";
import { isLogin, getLoginInfo } from "@/modules/auths/login";

const authMiddleware: RequestHandler = (req, res, next) => {
  if (!isLogin(req))
    return res.status(403).json({
      error: "not logged in",
    });

  const { id, oid } = getLoginInfo(req);
  req.userOid = oid;
  req.userUid = id;

  next();
};

export default authMiddleware;
