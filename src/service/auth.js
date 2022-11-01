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
const logger = require("../modules/logger");
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
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (data == TOKEN_EXPIRED) {
      return res.status(401).json({ message: 'Expired token' });
    }

    if (data.type !== 'access') {
      return res.status(401).json({ message: 'Not Access token' });
    }

    const userInfo = await userModel.findOne({ _id: data.id });

    if (!userInfo) return res.status(401).json({ message: 'Invalid token' });
    else{
      login(req, userInfo.sid, userInfo.id, userInfo.name);
      res.redirect(security.frontUrl + "/");
    }
  } catch (e) {
    logger.error(e);
    return res.status(500).send("server error");
  }
}

const createNewTokenHandler = async (req, res, userData) => {
  userModel.findOne(
    { id: userData.id },
    "name id withdraw ban",
    async (err, result) => {
      if (err) {
        logger.error(err);
        loginFalse(req, res);
      }
      else if (!result) joinus(req, res, userData);
      else if (result.name !== userData.name) update(req, res, userData);
      else {
        const accessToken = await jwt.sign({ id: result._id, deviceToken: req.body.deviceToken ,type: 'access' });
        const refreshToken = await jwt.sign({ id: result._id,  deviceToken: req.body.deviceToken ,type: 'refresh' });
        res.redirect( "org.sparcs.taxiApp://login?accessToken=" + accessToken.token + "&refreshToken=" + refreshToken.token);
      }
    }
  );
}

const refreshAccessToken = async (req, res) => {
  const { accessToken, refreshToken } = req.body;
  if (!accessToken || !refreshToken) return res.status(400).send("invalid request");
  
  try {
    const data = await jwt.verify(refreshToken);

    const accessTokenStatus = await jwt.verify(accessToken);

    if (accessTokenStatus === TOKEN_INVALID) {
      return res.status(401).json({ message: 'Invalid access token' });
    }

    if (data === TOKEN_INVALID) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (data === TOKEN_EXPIRED) {
      return res.status(401).json({ message: 'Expired token' });
    }

    if (!(data.type === 'refresh')) {
      return res.status(401).json({ message: 'Not Refresh token' });
    }

    const newAccessToken = await jwt.sign({ id: data.id, type: 'access' });
    const newRefreshToken = await jwt.sign({ id: data.id, type: 'refresh' });
    res.json({ accessToken: newAccessToken.token, refreshToken: newRefreshToken.token });
  }
  catch (e) {
    logger.error(e);
    res.status(501).send("server error");
  }
}

const registerDeviceTokenHandler = async (req, res) => {
  try{
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
      logger.error(e);
      res.status(500).send("server error");
    }
  } catch (e) {
    logger.error(e);
    res.status(500).send("server error");
  }
}

const sparcsssoForAppHandler = (req, res) => {
  req.session.isApp = true;
  sparcsssoHandler(req, res);
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
      if(req.session.isApp){
        createNewTokenHandler(req, res, userData);
      } else {
        loginDone(req, res, userData);
      }
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
  refreshAccessToken,
  registerDeviceTokenHandler,
  sparcsssoForAppHandler
};
