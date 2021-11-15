const { isLogin, getLoginInfo } = require("../auth/login");

// const authMiddleware = (req, res, next) => {
//   if (!isLogin(req)) {
//     console.log("Access denied");
//     console.log("loginCheck Middleware");
//     res.status("403").json({
//       error: "not logged in",
//     });
//   } else {
//     next();
//   }
// }

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
