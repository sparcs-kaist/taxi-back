const { frontUrl } = require("../../loadenv");
const { userModel } = require("../modules/stores/mongo");
const { logout, login } = require("../modules/auths/login");

const { unregisterDeviceToken } = require("../modules/fcm");
const {
  generateNickname,
  generateProfileImageUrl,
} = require("../modules/modifyProfile");
const logger = require("../modules/logger");
const jwt = require("../modules/auths/jwt");

const { registerDeviceTokenHandler } = require("../services/auth");
const loginReplacePage = require("../views/loginReplacePage");

const makeInfo = (id) => {
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

// 새로운 유저 만들기
// 이거 왜 이름이 joinus?
const joinus = (req, res, userData, redirectPath = "/") => {
  const newUser = new userModel({
    id: userData.id,
    name: userData.name,
    nickname: userData.nickname,
    profileImageUrl: userData.profileImageUrl,
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
      logger.error(err);
      return;
    }
    loginDone(req, res, userData, redirectPath);
  });
};

// 주어진 데이터로 DB 검색
// 만약 없으면 새로운 유저 만들기
// 있으면 로그인 진행 후 리다이렉트
const loginDone = (req, res, userData, redirectPath = "/") => {
  userModel.findOne(
    { id: userData.id },
    "_id name id withdraw ban",
    async (err, result) => {
      if (err) logger.error(logger.error(err));
      else if (!result) joinus(req, res, userData, redirectPath);
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

        login(req, userData.sid, result.id, result._id, result.name);
        res.redirect(frontUrl + redirectPath);
      }
    }
  );
};

const loginReplaceHandler = (req, res) => {
  const { id } = req.body;
  const redirectPath = decodeURIComponent(req.body?.redirect || "%2F");
  loginDone(req, res, makeInfo(id), redirectPath);
};

const sparcsssoHandler = (req, res) => {
  const redirectPath = decodeURIComponent(req.query?.redirect || "%2F");
  const isApp = !!req.query.isApp;

  req.session.isApp = isApp;
  res.end(loginReplacePage(redirectPath));
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
    const ssoLogoutUrl = frontUrl + redirectPath;
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
