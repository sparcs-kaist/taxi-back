const { userModel } = require("../modules/stores/mongo");
const { logout, login } = require("../modules/auths/login");

const { unregisterDeviceToken } = require("../modules/fcm");
const {
  generateNickname,
  generateProfileImageUrl,
} = require("../modules/modifyProfile");
const logger = require("../modules/logger");
const jwt = require("../modules/auths/jwt");

const { registerDeviceTokenHandler, tryLogin } = require("../services/auth");
const loginReplacePage = require("../views/loginReplacePage");

const createUserData = (id) => {
  const info = {
    id: id,
    sid: id + "-sid",
    name: id + "-name",
    nickname: generateNickname(id),
    profileImageUrl: generateProfileImageUrl(),
    facebook: id + "-facebook",
    twitter: id + "-twitter",
    kaist: "20220411",
    sparcs: id + "-sparcs",
    email: "taxi@sparcs.org",
  };
  return info;
};

const loginReplaceHandler = (req, res) => {
  const { id } = req.body;
  const loginAfterState = req.session?.loginAfterState;
  if (!loginAfterState)
    return res.status(400).send("SparcsssoCallbackHandler : invalid request");
  const { redirectOrigin, redirectPath } = loginAfterState;
  tryLogin(req, res, createUserData(id), redirectOrigin, redirectPath);
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

module.exports = {
  loginReplaceHandler,
  sparcsssoHandler,
  logoutHandler,
  registerDeviceTokenHandler,
};
