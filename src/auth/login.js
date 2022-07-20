const getLoginInfo = (req) => {
  if (req.session.loginInfo) {
    const { id, sid, name, time } = req.session.loginInfo;
    const timeFlow = Date.now() - time;
    console.log(timeFlow);
    if (timeFlow > 3600000)
      return { id: undefined, sid: undefined, name: undefined };
    else {
      req.session.time = Date.now();
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

const logout = (req, res) => {
  // 로그아웃 전 socket.io 소켓들 연결부터 끊기
  if (req.session.socketId && req.session.chatRoomId) {
    req.app.get("io").in(req.session.socketId).disconnectSockets(true);
    leaveChatRoom(req);
  }
  req.session.destroy((err) => {
    if (err) console.log(err);
  });
};

const joinChatRoom = (req, socketId, roomId) => {
  req.session.socketId = socketId;
  req.session.chatRoomId = roomId;
};

const leaveChatRoom = (req) => {
  req.session.socketId = null;
  req.session.chatRoomId = null;
};

module.exports = {
  getLoginInfo,
  isLogin,
  login,
  logout,
  joinChatRoom,
  leaveChatRoom,
};
