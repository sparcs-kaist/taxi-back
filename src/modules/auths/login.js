const logger = require("../logger");

const getLoginInfo = (req) => {
  if (req.session.loginInfo) {
    const { id, sid, name, time } = req.session.loginInfo;
    const timeFlow = Date.now() - time;
    // if (timeFlow > 14 * 24 * 3600 * 1000/* 14일 */)
    if (timeFlow > 1 * 3600 * 1000 /* 1시간 */)
      return { id: undefined, sid: undefined, name: undefined };
    else {
      req.session.loginInfo.time = Date.now();
      return { id, sid, name };
    }
  } else return { id: undefined, sid: undefined, name: undefined };
};

const isLogin = (req) => {
  const loginInfo = getLoginInfo(req);
  if (loginInfo.id) return true;
  else return false;
};

const login = (req, sid, id, name) => {
  req.session.loginInfo = { sid, id, name, time: Date.now() };
};

const logout = (req) => {
  // 로그아웃 전 socket.io 소켓들 연결부터 끊기
  if (req.session.socketId) {
    req.app.get("io").in(req.session.socketId).disconnectSockets(true);
    disconnectUser(req);
  }
  req.session.destroy((err) => {
    if (err) logger.error(err);
  });
};

const connectUser = (req, socketId) => {
  req.session.socketId = socketId;
};

const disconnectUser = (req) => {
  req.session.socketId = null;
};

module.exports = {
  getLoginInfo,
  isLogin,
  login,
  logout,
  connectUser,
  disconnectUser,
};
