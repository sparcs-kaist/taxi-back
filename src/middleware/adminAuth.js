// 관리자 유무를 확인하기 위한 미들웨어입니다.

const { isLogin, getLoginInfo } = require("../auth/login");
const { frontUrl } = require("../../security");
const { userModel, adminIpWhitelistModel } = require("../db/mongo");

const adminAuthMiddleware = async (req, res, next) => {
  // Check if user is logged in
  if (!isLogin(req)) {
    return res.redirect(frontUrl);
  }
  try {
    // 관리자 유무를 확인
    const { id } = getLoginInfo(req);
    const user = await userModel.findOne({ id });
    if (!user.isAdmin) res.redirect(frontUrl);

    // 접속한 IP가 화이트리스트에 있는지 확인
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ipWhitelist = await adminIpWhitelistModel.find({});
    // if ()
    next();
  } catch (e) {
    res.redirect(frontUrl);
  }
};

module.exports = adminAuthMiddleware;
