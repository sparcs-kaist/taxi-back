const security = require("../../security");
const { userModel } = require("../db/mongo");
const { user: userPattern } = require("../db/patterns");
const { getLoginInfo, logout, login } = require("../auth/login");

const {
  registerDeviceToken,
  unregisterDeviceToken,
  validateDeviceToken,
} = require("../modules/fcm");
const logger = require("../modules/logger");
const {
  generateNickname,
  generateProfileImageUrl,
  getFullUsername,
} = require("../modules/modifyProfile");
const jwt = require("../modules/jwt");
const APP_URI_SCHEME = require("../../security").appUriScheme;

// SPARCS SSO
const Client = require("../auth/sparcsso");
const client = new Client(security.sparcssso?.id, security.sparcssso?.key);

const transUserData = (userData) => {
  const kaistInfo = userData.kaist_info ? JSON.parse(userData.kaist_info) : {};

  // info.ku_std_no: 학번
  // info.isEligible: 카이스트 구성원인지 여부. DB에 저장하지 않음.
  const info = {
    id: userData.uid,
    sid: userData.sid,
    name: getFullUsername(userData.first_name, userData.last_name),
    facebook: userData.facebook_id || "",
    twitter: userData.twitter_id || "",
    kaist: kaistInfo?.ku_std_no || "",
    sparcs: userData.sparcs_id || "",
    email: userData.email,
    isEligible: userPattern.allowedEmployeeTypes.test(kaistInfo?.employeeType),
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
      loginFail(req, res);
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
      if (err) loginFail(req, res);
      else if (!result) joinus(req, res, userData);
      else if (result.name != userData.name) update(req, res, userData);
      else {
        login(req, userData.sid, result.id, result.name);
        res.redirect(security.frontUrl + "/");
      }
    }
  );
};

const loginFail = (req, res, redirectUrl = "") => {
  res.redirect(redirectUrl || security.frontUrl + "/login/fail");
};

const generateTokenHandler = (req, res) => {
  req.session.isApp = true;
  sparcsssoHandler(req, res);
};

const sparcsssoHandler = (req, res) => {
  const { url, state } = client.getLoginParams();
  req.session.state = state;
  res.redirect(url);
};

const sparcsssoCallbackHandler = (req, res) => {
  const state1 = req.session.state;
  const state2 = req.body.state || req.query.state;

  if (state1 !== state2) loginFail(req, res);
  else {
    const code = req.body.code || req.query.code;
    client.getUserInfo(code).then((userDataBefore) => {
      const userData = transUserData(userDataBefore);
      if (userData.isEligible || security.nodeEnv !== "production") {
        if (req.session.isApp) {
          createNewTokenHandler(req, res, userData);
        } else {
          loginDone(req, res, userData);
        }
      } else {
        // 카이스트 구성원이 아닌 경우, SSO 로그아웃 이후, 로그인 실패 URI 로 이동합니다
        const { sid } = userData;
        const redirectUrl = security.frontUrl + "/login/fail";
        const ssoLogoutUrl = client.getLogoutUrl(sid, redirectUrl);
        loginFail(req, res, ssoLogoutUrl);
      }
    });
  }
};

const createNewTokenHandler = (req, res, userData) => {
  userModel.findOne(
    { id: userData.id },
    "name id withdraw ban",
    async (err, result) => {
      if (err) {
        logger.error(err);
        loginFail(req, res);
      } else if (!result) joinus(req, res, userData);
      else if (result.name !== userData.name) update(req, res, userData);
      else {
        const accessToken = await jwt.sign({
          id: result._id,
          deviceToken: req.body.deviceToken,
          type: "access",
        });
        const refreshToken = await jwt.sign({
          id: result._id,
          deviceToken: req.body.deviceToken,
          type: "refresh",
        });
        res.redirect(
          APP_URI_SCHEME +
            "://login?accessToken=" +
            accessToken.token +
            "&refreshToken=" +
            refreshToken.token
        );
      }
    }
  );
};

const logoutHandler = async (req, res) => {
  try {
    const { id, sid } = getLoginInfo(req);

    // DB에서 deviceToken 레코드를 삭제합니다.
    const deviceToken = req.session?.deviceToken;
    if (deviceToken) {
      const user = await userModel.findOne({ id }, "_id");
      await unregisterDeviceToken(user._id, deviceToken);
    }

    const redirectUrl = security.frontUrl + "/login";
    const ssoLogoutUrl = client.getLogoutUrl(sid, redirectUrl);
    logout(req, res);
    res.json({ ssoLogoutUrl });
  } catch (e) {
    res.status(500).send("Auth/logout : internal server error");
  }
};

const registerDeviceTokenHandler = async (req, res) => {
  try {
    // 해당 FCM device token이 유효한지 검사합니다.
    const deviceToken = req.body.deviceToken;
    const isValid = await validateDeviceToken(deviceToken);
    if (!isValid) {
      return res
        .status(400)
        .send("Auth/registerDeviceToken : deviceToken is invalid");
    }

    // 데이터베이스에 deviceToken 레코드를 추가합니다.
    const user = await userModel.findOne({ id: req.userId }, "_id");
    const newDeviceToken = await registerDeviceToken(user._id, deviceToken);

    // 세션에 현재 사용자 기기의 deviceToken을 저장합니다.
    req.session.deviceToken = deviceToken;

    return res.status(200).json({
      deviceToken: newDeviceToken,
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send("Auth/registerDeviceToken : internal server error");
  }
};

module.exports = {
  sparcsssoHandler,
  sparcsssoCallbackHandler,
  logoutHandler,
  generateTokenHandler,
  registerDeviceTokenHandler,
};
