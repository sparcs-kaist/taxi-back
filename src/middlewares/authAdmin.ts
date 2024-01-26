// 관리자 유무를 확인하기 위한 미들웨어입니다.
import { type Request, type Response, type NextFunction } from "express";
import { isLogin, getLoginInfo } from "@/modules/auths/login";
import { userModel, adminIPWhitelistModel } from "@/modules/stores/mongo";

const authAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 로그인 여부를 확인
    if (!isLogin(req)) return res.redirect(req.origin ?? "/");

    // 관리자 유무를 확인
    const { id } = getLoginInfo(req);
    const user = await userModel.findOne({ id });
    if (!user?.isAdmin) return res.redirect(req.origin ?? "/");

    // 접속한 IP가 화이트리스트에 있는지 확인
    const ipWhitelist = await adminIPWhitelistModel.find({});
    if (!req.clientIP) return res.redirect(req.origin ?? "/");
    if (
      ipWhitelist.length > 0 &&
      ipWhitelist.map((x: any) => x.ip).indexOf(req.clientIP) < 0 // TODO: Remove any
    )
      return res.redirect(req.origin ?? "/");

    return next();
  } catch (e) {
    return res.redirect(req.origin ?? "/");
  }
};

export default authAdminMiddleware;
