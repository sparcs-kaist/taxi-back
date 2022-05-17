// 관리자 유무를 확인하기 위한 미들웨어입니다.

const { isLogin, getLoginInfo } = require("../auth/login");
const { frontUrl } = require("../../security");
const { userModel } = require("../db/mongo");

const adminAuthMiddleware = async (req, res, next) => {
  // Check if user is logged in
  if (!isLogin(req)) {
    res.redirect(frontUrl);
    return;
  }
  try {
    const { id } = getLoginInfo(req);
    const user = await userModel.findOne({ id });
    if (user.isAdmin) {
      next();
    } else {
      res.redirect(frontUrl);
    }
  } catch (e) {
    res.redirect(frontUrl);
  }
};

module.exports = adminAuthMiddleware;
