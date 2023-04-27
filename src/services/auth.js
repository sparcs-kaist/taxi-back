const {
  sparcssso: sparcsssoEnv,
  frontUrl,
  nodeEnv,
  testAccounts,
} = require("../../loadenv");
const { userModel } = require("../modules/stores/mongo");
const { user: userPattern } = require("../modules/patterns");
const { getLoginInfo, logout, login } = require("../modules/auths/login");

const { unregisterDeviceToken } = require("../modules/fcm");
const {
  generateNickname,
  generateProfileImageUrl,
  getFullUsername,
} = require("../modules/modifyProfile");
const jwt = require("../modules/auths/jwt");

// SPARCS SSO
const Client = require("../modules/auths/sparcssso");
const client = new Client(sparcsssoEnv?.id, sparcsssoEnv?.key);

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
    "_id name id withdraw ban",
    async (err, result) => {
      if (err) loginFail(req, res);
      else if (!result) joinus(req, res, userData);
      else if (result.name != userData.name) update(req, res, userData);
      else {
        if (req.session.isApp) {
          const { token: accessToken } = await jwt.sign({
            id: result._id,
            type: "access",
          });
          const { token: refreshToken } = await jwt.sign({
            id: result._id,
            type: "refresh",
          });
          req.session.accessToken = accessToken;
          req.session.refreshToken = refreshToken;
        }

        const redirectPath = req.session?.state_redirectPath || "/";
        req.session.state_redirectPath = undefined;
        login(req, userData.sid, result.id, result.name);
        res.redirect(frontUrl + redirectPath);
      }
    }
  );
};

const loginFail = (req, res, redirectUrl = "") => {
  res.redirect(redirectUrl || frontUrl + "/login/fail");
};

const sparcsssoHandler = (req, res) => {
  const redirectPath = decodeURIComponent(req.query?.redirect || "%2F");
  const isApp = !!req.query.isApp;
  const { url, state } = client.getLoginParams();

  req.session.state = state;
  req.session.state_redirectPath = redirectPath;
  req.session.isApp = isApp;
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
      const isTestAccount = testAccounts?.includes(userData.email);
      if (userData.isEligible || nodeEnv !== "production" || isTestAccount) {
        loginDone(req, res, userData);
      } else {
        // 카이스트 구성원이 아닌 경우, SSO 로그아웃 이후, 로그인 실패 URI 로 이동합니다
        const { sid } = userData;
        const redirectUrl = frontUrl + "/login/fail";
        const ssoLogoutUrl = client.getLogoutUrl(sid, redirectUrl);
        loginFail(req, res, ssoLogoutUrl);
      }
    });
  }
};

const loginReplaceHandler = (req, res) => {
  res.status(400).json({
    error: "Auths/login/replace : Bad Request",
  });
};

const logoutHandler = async (req, res) => {
  const redirectPath = decodeURIComponent(req.query?.redirect || "%2F");

  try {
    const { sid } = getLoginInfo(req);

    // DB에서 deviceToken 레코드를 삭제합니다.
    const deviceToken = req.session?.deviceToken;
    if (deviceToken) {
      await unregisterDeviceToken(deviceToken);
    }

    // 로그아웃 URL을 생성 및 반환
    const redirectUrl = frontUrl + redirectPath;
    const ssoLogoutUrl = client.getLogoutUrl(sid, redirectUrl);
    logout(req, res);
    res.json({ ssoLogoutUrl });
  } catch (e) {
    res.status(500).send("Auth/logout : internal server error");
  }
};

module.exports = {
  sparcsssoHandler,
  sparcsssoCallbackHandler,
  loginReplaceHandler,
  logoutHandler,
};
