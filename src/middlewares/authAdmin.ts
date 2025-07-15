// 관리자 유무를 확인하기 위한 미들웨어입니다.
import type { RequestHandler } from "express";
import { isLogin, getLoginInfo } from "@/modules/auths/login";
import { userModel, adminIPWhitelistModel } from "@/modules/stores/mongo";

const authAdminMiddleware: RequestHandler = async (req, res, next) => {
  const redirectUrl = req.origin ?? "/";

  try {
    // 로그인 여부를 확인
    if (!isLogin(req)) return res.redirect(redirectUrl);

    // 관리자 유무를 확인
    const { oid } = getLoginInfo(req);
    const user = await userModel.findOne({ _id: oid, withdraw: false });
    if (!user?.isAdmin) return res.redirect(redirectUrl);

    // 접속한 IP가 화이트리스트에 있는지 확인
    const ipWhitelist = await adminIPWhitelistModel.find({});
    if (!req.clientIP) return res.redirect(redirectUrl);
    if (
      ipWhitelist.length > 0 &&
      ipWhitelist.map((x) => x.ip).indexOf(req.clientIP) < 0
    )
      return res.redirect(redirectUrl);

    next();
  } catch (e) {
    return res.redirect(redirectUrl);
  }
};

export default authAdminMiddleware;
