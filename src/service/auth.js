const security = require("../../security");
const { userModel } = require("../db/mongo");
const { deviceTokenModel, authTokenModel } = require('../db/mongo');
const { getLoginInfo, logout, login } = require("../auth/login");
const {
  generateNickname,
  generateProfileImageUrl,
  getFullUsername,
} = require("../modules/modifyProfile");
const jwt = require('../modules/jwt');

// SPARCS SSO
const Client = require("../auth/sparcsso");
const client = new Client(security.sparcssso?.id, security.sparcssso?.key);

const transUserData = (userData) => {
  const kaistInfo = userData.kaist_info ? JSON.parse(userData.kaist_info) : {};
  const info = {
    id: userData.uid,
    sid: userData.sid,
    name: getFullUsername(userData.first_name, userData.last_name),
    facebook: userData.facebook_id || "",
    twitter: userData.twitter_id || "",
    kaist: kaistInfo?.ku_std_no || "",
    sparcs: userData.sparcs_id || "",
    email: userData.email,
  };
  return info;
};

// 가입시키기
const joinus = (req, res, userData) => {
  const newUser = new userModel({
    id: userData.id,
    name: userData.name,
    nickname: generateNickname(userData.id),
    profileImageUrl: generateProfileImageUrl(),
    joinat: req.timestamp,
    subinfo: {
      kaist: userData.kaist,
      sparcs: userData.sparcs,
      facebook: userData.facebook,
      twitter: userData.twitter,
    },
    email: userData.email,
  });
  newUser.save((err) => {
    if (err) {
      loginFalse(req, res);
      return;
    }
    loginDone(req, res, userData);
  });
};

// 닉네임 변경?
const update = async (req, res, userData) => {
  const updateInfo = { name: userData.name };
  await userModel.updateOne({ id: userData.id }, updateInfo);
  loginDone(req, res, userData);
};

const loginDone = (req, res, userData) => {
  userModel.findOne(
    { id: userData.id },
    "name id withdraw ban",
    (err, result) => {
      if (err) loginFalse(req, res);
      else if (!result) joinus(req, res, userData);
      else if (result.name != userData.name) update(req, res, userData);
      else {
        login(req, userData.sid, result.id, result.name);
        res.redirect(security.frontUrl + "/");
      }
    }
  );
};

const loginFalse = (req, res) => {
  res.redirect(security.frontUrl + "/login/false"); // 리엑트로 연결되나?
};

const loginWithToken = async (req, res) => {
  const { token } = req.body;
  const { user, expireAt } = await authTokenModel.findOne({ token: token });
  if (!user) return;
  if (expireAt < Date.now()) return res.status(401).send('expired token');
  const userInfo = await userModel.findOne({ id: user });
  if (!userInfo) return;
  else{
    login(req, userInfo.sid, userInfo.id, userInfo.name);
    res.status(200).send("success");
  }
}

const createNewTokenHandler = async (req, res, userData) => {
  userModel.findOne(
    { id: userData.id },
    "name id withdraw ban",
    async (err, result) => {
      if (err) loginFalse(req, res);
      else if (!result) joinus(req, res, userData);
      else if (result.name != userData.name) update(req, res, userData);
      else {
        const accessToken = await jwt.sign({ user: userData, deviceToken: req.body.deviceToken ,type: 'access' });
        const refreshToken = await jwt.sign({ user: userData,  deviceToken: req.body.deviceToken ,type: 'refresh' });
        res.redirect("org.sparcs.taxi_app://login?accessToken=" + accessToken + "&refreshToken=" + refreshToken);
      }
    }
  );
}

const refreshAccessToken = async (req, res) => {
  const { accessToken, refreshToken } = req.body;
  if (!accessToken || !refreshToken) return res.status(400).send("invalid request");
  
  try {
    const { user, deviceToken } = await jwt.verify(refreshToken);
    const newAccessToken = await jwt.sign({ user, deviceToken, type: 'access' });
    res.status(200).send({ accessToken: newAccessToken });
  }
  catch (e) {
    res.status(401).send("invalid token");
  }
}

const registerDeviceTokenHandler = async (req, res) => {
  const { token } = req.body;
  const { id } = getLoginInfo(req);
  if (!token || !id) return res.status(400).send("invalid request");
  try {
    await deviceTokenModel.updateOne({
      user: id,
    }, 
    {user : id, deviceTokenModel: token}, {upsert: true, new: true});
    res.status(200).send("success");
  } catch (e) {
    res.status(500).send(e);
  }
}

const sparcsssoHandler = (req, res) => {
  const userInfo = getLoginInfo(req);
  const { url, state } = client.getLoginParams();
  req.session.state = state;
  res.redirect(url);
};

const sparcsssoCallbackHandler = (req, res) => {
  const state1 = req.session.state;
  const state2 = req.body.state || req.query.state;

  if (state1 != state2) loginFalse(req, res);
  else {
    const code = req.body.code || req.query.code;
    client.getUserInfo(code).then((userDataBefore) => {
      const userData = transUserData(userDataBefore);
      loginDone(req, res, userData);
    });
  }
};

const logoutHandler = (req, res) => {
  logout(req, res);
  res.status(200).send("logged out successfully");
};

module.exports = {
  sparcsssoHandler,
  sparcsssoCallbackHandler,
  logoutHandler,
};
