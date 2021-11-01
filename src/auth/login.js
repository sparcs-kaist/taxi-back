const getLoginInfo = (req) => {
  if (req.session.loginInfo) {
    const { id, sid, name, time } = req.session.loginInfo;
    const timeFlow = Date.now() - time;
    if (timeFlow > 3600000)
      return { id: undefined, sid: undefined, name: undefined };
    else {
      req.session.time = Date.now();
      return { id, sid, name };
    }
  } else return { id: undefined, sid: undefined, name: undefined };
};

const isLogin = (req) => {
  const loginInfo = this.getLoginInfo(req);
  if (loginInfo.id) return true;
  else return false;
};

const login = (req, sid, id, name) => {
  req.session.loginInfo = { sid, id, name, time: Date.now() };
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
  });
};

module.exports = {
  getLoginInfo,
  isLogin,
  login,
  logout,
};
