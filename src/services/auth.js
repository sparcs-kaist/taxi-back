const { nodeEnv, testAccounts } = require("@/loadenv");
const { userModel } = require("@/modules/stores/mongo");
const { user: userPattern } = require("@/modules/patterns").default;
const {
  ssoClient,
  getLoginInfo,
  logout,
  login,
} = require("@/modules/auths/login");

const { unregisterDeviceToken } = require("@/modules/fcm");
const {
  generateNickname,
  generateProfileImageUrl,
  getFullUsername,
} = require("@/modules/modifyProfile");
const jwt = require("@/modules/auths/jwt");
const logger = require("@/modules/logger").default;

const transUserData = (userData) => {
  const kaistInfo = userData.kaist_info ? JSON.parse(userData.kaist_info) : {};

  // info.ku_std_no: 학번
  // info.isEligible: 카이스트 구성원인지 여부
  const info = {
    id: userData.uid,
    sid: userData.sid,
    name: getFullUsername(userData.first_name, userData.last_name),
    facebook: userData.facebook_id || "",
    twitter: userData.twitter_id || "",
    kaist: kaistInfo?.ku_std_no || "",
    kaistType: kaistInfo?.employeeType || "", // DB에 저장하지 않음
    sparcs: userData.sparcs_id || "",
    email: kaistInfo?.mail || userData.email,
    isEligible: userPattern.allowedEmployeeTypes.test(kaistInfo?.employeeType), // DB에 저장하지 않음
  };
  return info;
};

const joinus = async (req, userData) => {
  const oldUser = await userModel
    .findOne(
      {
        id: userData.id,
        withdraw: true,
      },
      "withdrewAt"
    )
    .sort({ withdrewAt: -1 })
    .lean();
  if (oldUser && oldUser.withdrewAt) {
    // 탈퇴 후 7일이 지나지 않았을 경우, 가입을 거부합니다.
    const diff = req.timestamp - oldUser.withdrewAt.getTime();
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return false;
    }
  }

  const newUser = new userModel({
    id: userData.id, // NOTE: SSO uid
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
  await newUser.save();
  return true;
};

const update = async (userData) => {
  const updateInfo = {
    name: userData.name,
    email: userData.email,
    "subinfo.kaist": userData.kaist,
  };
  await userModel.updateOne({ id: userData.id, withdraw: false }, updateInfo); // NOTE: SSO uid 쓰는 곳
  logger.info(
    `Update user info: ${userData.id} ${userData.name} ${userData.email} ${userData.kaist}`
  );
};

const tryLogin = async (req, res, userData, redirectOrigin, redirectPath) => {
  try {
    const user = await userModel.findOne(
      { id: userData.id, withdraw: false }, // NOTE: SSO uid 쓰는 곳
      "_id name email subinfo id withdraw ban"
    );
    if (!user) {
      if (await joinus(req, userData)) {
        return tryLogin(req, res, userData, redirectOrigin, redirectPath);
      } else {
        const redirectUrl = new URL("/login/fail", redirectOrigin).href;
        res.redirect(redirectUrl);
        return;
      }
    }
    if (
      user.name !== userData.name ||
      user.email !== userData.email ||
      user.subinfo.kaist !== userData.kaist
    ) {
      await update(userData);
      logger.info(
        `Past user info: ${user.id} ${user.name} ${user.email} ${user.subinfo.kaist}`
      );
      return tryLogin(req, res, userData, redirectOrigin, redirectPath);
    }

    if (req.session.isApp) {
      const { token: accessToken } = await jwt.sign({
        id: user._id,
        type: "access",
      });
      const { token: refreshToken } = await jwt.sign({
        id: user._id,
        type: "refresh",
      });
      req.session.accessToken = accessToken;
      req.session.refreshToken = refreshToken;
    }

    login(req, userData.sid, user.id, user._id, user.name);

    res.redirect(new URL(redirectPath, redirectOrigin).href);
  } catch (err) {
    logger.error(err);
    const redirectUrl = new URL("/login/fail", redirectOrigin).href;
    res.redirect(redirectUrl);
  }
};

const sparcsssoHandler = (req, res) => {
  const redirectPath = decodeURIComponent(req.query?.redirect || "%2F");
  const isApp = !!req.query.isApp;
  const { url, state } = ssoClient.getLoginParams();

  req.session.loginAfterState = {
    state: state,
    redirectOrigin: req.origin,
    redirectPath: redirectPath,
  };
  req.session.isApp = isApp;
  res.redirect(url + "&social_enabled=0&show_disabled_button=0");
};

const sparcsssoCallbackHandler = (req, res) => {
  const loginAfterState = req.session?.loginAfterState;
  const { state: stateForCmp, code } = req.query;

  if (!loginAfterState)
    return res.status(400).send("Auth/sparcssso/callback : invalid request");

  const { state, redirectOrigin, redirectPath } = loginAfterState;
  req.session.loginAfterState = undefined;

  if (!state || !redirectOrigin || !redirectPath) {
    return res.status(400).send("Auth/sparcssso/callback : invalid request");
  }

  if (state !== stateForCmp) {
    logger.info("Login denied: state mismatch");

    const redirectUrl = new URL("/login/fail", redirectOrigin).href;
    return res.redirect(redirectUrl);
  }

  ssoClient.getUserInfo(code).then((userDataBefore) => {
    const userData = transUserData(userDataBefore);
    logger.info(`Login requested: ${JSON.stringify(userData)}`);

    const isTestAccount = testAccounts?.includes(userData.email);
    if (userData.isEligible || nodeEnv !== "production" || isTestAccount) {
      tryLogin(req, res, userData, redirectOrigin, redirectPath);
    } else {
      // 카이스트 구성원이 아닌 경우, SSO 로그아웃 이후, 로그인 실패 URI 로 이동합니다
      const { id, sid, kaist, kaistType } = userData;
      logger.info(
        `Login denied: not a KAIST member (uid: ${id}, sid: ${sid}, kaist: ${kaist}, kaistType: ${kaistType})`
      );

      const redirectUrl = new URL("/login/fail", redirectOrigin).href;
      const ssoLogoutUrl = ssoClient.getLogoutUrl(sid, redirectUrl);
      res.redirect(ssoLogoutUrl);
    }
  });
};

const loginReplaceHandler = (req, res) => {
  res.status(400).json({
    error: "Auth/login/replace : Bad Request",
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
    const redirectUrl = new URL(redirectPath, req.origin).href;
    const ssoLogoutUrl = ssoClient.getLogoutUrl(sid, redirectUrl);
    logout(req, res);
    res.json({ ssoLogoutUrl });
  } catch (e) {
    res.status(500).send("Auth/logout : internal server error");
  }
};

module.exports = {
  tryLogin,
  sparcsssoHandler,
  sparcsssoCallbackHandler,
  loginReplaceHandler,
  logoutHandler,
};
