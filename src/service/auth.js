const security = require("../../security");
const { userModel } = require("../db/mongo");
const { deviceTokenModel } = require('../db/mongo');
const { getLoginInfo, logout, login } = require("../auth/login");
const {
  generateNickname,
  generateProfileImageUrl,
  getFullUsername,
} = require("../modules/modifyProfile");
const jwt = require('../modules/jwt');

const TOKEN_EXPIRED = -3;
const TOKEN_INVALID = -2;

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
  const { token } = req.query;
  try{
    if (!token) return res.status(400).send("invalid request");
    const data = await jwt.verify(token);

    if (data == TOKEN_INVALID) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    if (data == TOKEN_EXPIRED) {
      res.status(401).json({ message: 'Expired token' });
      return;
    }

    console.log(data);

    if (!(data.type == 'access')) {
      res.status(401).json({ message: 'Not Access token' });
      return;
    }

    const userInfo = await userModel.findOne({ _id: data.id });

    if (!userInfo) return res.status(401).json({ message: 'Invalid token' });
    else{
      login(req, userInfo.sid, userInfo.id, userInfo.name);
      res.redirect(security.frontUrl + "/");
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send("server error");
  }

  
}

const createNewTokenHandler = async (req, res) => {
  const userData = getLoginInfo(req);

  userModel.findOne(
    { id: userData.id },
    "name id withdraw ban",
    async (err, result) => {
      if (err) {
        console.log(err);
        loginFalse(req, res);
      }
      else if (!result) joinus(req, res, userData);
      else if (result.name != userData.name) update(req, res, userData);
      else {
        const accessToken = await jwt.sign({ id: result._id, deviceToken: req.body.deviceToken ,type: 'access' });
        const refreshToken = await jwt.sign({ id: result._id,  deviceToken: req.body.deviceToken ,type: 'refresh' });
        console.log(accessToken, refreshToken);
        res.writeHead(301, {"Location" : "org.sparcs.taxi_app://login?accessToken=" + accessToken.token + "&refreshToken=" + refreshToken.token}).end;
      }
    }
  );
}

const refreshAccessToken = async (req, res) => {
  const { accessToken, refreshToken } = req.body;
  if (!accessToken || !refreshToken) return res.status(400).send("invalid request");
  
  try {
    const { id } = await jwt.verify(refreshToken);
    const newAccessToken = await jwt.sign({ id: id, type: 'access' });
    const newRefreshToken = await jwt.sign({ id: id, type: 'refresh' });
    res.status(200).send({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  }
  catch (e) {
    res.status(401).send("invalid token");
  }
}

const registerDeviceTokenHandler = async (req, res) => {
  try{
    const { token } = req.body;
    const { id } = getLoginInfo(req);
    console.log(id, token);

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
  loginWithToken,
  createNewTokenHandler,
  refreshAccessToken,
  registerDeviceTokenHandler,
};
