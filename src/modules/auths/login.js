const { session: sessionConfig } = require("../../../loadenv");
const logger = require("../logger");

const getLoginInfo = (req) => {
  if (req.session.loginInfo) {
    const { id, sid, oid, name, time } = req.session.loginInfo;
    const timeFlow = Date.now() - time;
    // 14일이 지난 세션에 대해서는 로그인 정보를 반환하지 않습니다.
    // 세션은 새로운 요청 시 갱신되지 않습니다.
    if (timeFlow > sessionConfig.expiry) {
      return { id: undefined, sid: undefined, oid: undefined, name: undefined };
    }
    return { id, sid, oid, name };
  }
  return { id: undefined, sid: undefined, oid: undefined, name: undefined };
};

const isLogin = (req) => {
  const loginInfo = getLoginInfo(req);
  if (loginInfo.id) return true;
  else return false;
};

const login = (req, sid, id, oid, name) => {
  req.session.loginInfo = { sid, id, oid, name, time: Date.now() };
};

const logout = (req) => {
  // 로그아웃 전 socket.io 소켓들 연결부터 끊기
  const io = req.app.get("io");
  if (io) io.in(`session-${req.session.id}`).disconnectSockets(true);

  req.session.destroy((err) => {
    if (err) logger.error(err);
  });
};

module.exports = {
  getLoginInfo,
  isLogin,
  login,
  logout,
};
