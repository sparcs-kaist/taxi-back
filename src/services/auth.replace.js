const { logout } = require("@/modules/auths/login");
const { unregisterDeviceToken } = require("@/modules/fcm");
const { transUserData, tryLogin } = require("@/services/auth");
const loginReplacePage = require("@/views/loginReplacePage").default;

const createUserData = (uid) => {
  const userDataBefore = {
    uid,
    sid: uid + "-sid",
    email: "taxi@sparcs.org",
    first_name: uid + "-firstname",
    last_name: uid + "-lastname",
    gender: "*H",
    birthday: "",
    flags: ["TEST", "SPARCS"],
    facebook_id: uid + "-facebook",
    twitter_id: uid + "-twitter",
    kaist_id: "20230113",
    kaist_info: null,
    kaist_info_time: "",
    kaist_v2_info: null,
    kaist_v2_info_time: "",
    sparcs_id: uid + "-sparcs",
  };
  const userData = {
    ...transUserData(userDataBefore),
    name: uid + "-name",
    kaist: "20230113",
  };
  return { userDataBefore, userData };
};

const loginReplaceHandler = (req, res) => {
  const { id } = req.body;
  const loginAfterState = req.session?.loginAfterState;
  if (!loginAfterState)
    return res.status(400).send("Auth/login/replace : invalid request");

  const { redirectOrigin, redirectPath } = loginAfterState;
  req.session.loginAfterState = undefined;

  const { userDataBefore, userData } = createUserData(id);
  tryLogin(req, res, userDataBefore, userData, redirectOrigin, redirectPath);
};

const sparcsssoHandler = (req, res) => {
  const redirectPath = decodeURIComponent(req.query?.redirect || "%2F");
  const isApp = !!req.query.isApp;

  req.session.loginAfterState = {
    redirectOrigin: req.origin,
    redirectPath: redirectPath,
  };
  req.session.isApp = isApp;
  res.end(loginReplacePage);
};

const logoutHandler = async (req, res) => {
  const redirectPath = decodeURIComponent(req.query?.redirect || "%2F");

  try {
    // DB에서 deviceToken 레코드를 삭제합니다.
    const deviceToken = req.session?.deviceToken;
    if (deviceToken) {
      await unregisterDeviceToken(deviceToken);
    }

    // sparcs-sso 로그아웃 URL을 생성 및 반환
    const ssoLogoutUrl = new URL(redirectPath, req.origin).href;
    logout(req, res);
    res.json({ ssoLogoutUrl });
  } catch (e) {
    res.status(500).send("Auth/logout : internal server error");
  }
};

const oneAppLoginHandler = (req, res) => {
  const { codeChallenge } = req.query;

  req.session.loginAfterState = {};
  req.session.isApp = false;
  req.session.oneAppState = { codeChallenge };
  res.end(loginReplacePage);
};

module.exports = {
  loginReplaceHandler,
  sparcsssoHandler,
  logoutHandler,
  oneAppLoginHandler,
};
