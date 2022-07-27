// 로그인된 상태에만 접근할 수 있는 라우터(rooms)를 위한 미들웨어입니다.

const { isLogin, getLoginInfo } = require("../auth/login");

const authMiddleware = (req, res, next) => {
  if (!isLogin(req)) {
    res.status(403).json({
      error: "not logged in",
    });
  } else {
    const { id } = getLoginInfo(req);
    req.userId = id;
    next();
  }
};

module.exports = authMiddleware;
