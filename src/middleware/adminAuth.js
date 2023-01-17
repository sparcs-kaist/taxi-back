// 관리자 유무를 확인하기 위한 미들웨어입니다.

const { isLogin, getLoginInfo } = require("../auth/login");
const { frontUrl } = require("../../security");
const { userModel, adminIPWhitelistModel } = require("../db/mongo");

const adminAuthMiddleware = async (req, res, next) => {
  try {
    // 로그인 여부를 확인
    if (!isLogin(req)) return res.redirect(frontUrl);

    // 관리자 유무를 확인
    const { id } = getLoginInfo(req);
    const user = await userModel.findOne({ id });
    if (!user.isAdmin) return res.redirect(frontUrl);

    // 접속한 IP가 화이트리스트에 있는지 확인
    const clientIP =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const ipWhitelist = await adminIPWhitelistModel.find({});
    if (!clientIP) return res.redirect(frontUrl);
    if (
      ipWhitelist.length > 0 &&
      ipWhitelist.map((x) => x.ip).indexOf(clientIP) < 0
    )
      return res.redirect(frontUrl);

    next();
  } catch (e) {
    res.redirect(frontUrl);
  }
};

module.exports = adminAuthMiddleware;
