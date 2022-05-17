// 관리자 유무를 확인하기 위한 미들웨어입니다.

const { isLogin } = require("../auth/login");
const { frontUrl } = require("../../security");

const adminAuthMiddleware = (req, res, next) => {
  // Check if user is logged in
  if (!isLogin(req)) {
    res.redirect(frontUrl);
    return;
  }

  // TODO: check if the user is admin.
  if (true) {
    next();
  } else {
    res.redirect(frontUrl);
  }
};

module.exports = adminAuthMiddleware;
