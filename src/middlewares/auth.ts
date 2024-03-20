// 로그인된 상태에만 접근할 수 있는 라우터(rooms)를 위한 미들웨어입니다.
import { type Request, type Response, type NextFunction } from "express";
import { isLogin, getLoginInfo } from "@/modules/auths/login";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!isLogin(req)) {
    res.status(403).json({
      error: "not logged in",
    });
  } else {
    const { id, oid } = getLoginInfo(req);
    req.userId = id;
    req.userOid = oid;
    next();
  }
};

export default authMiddleware;
