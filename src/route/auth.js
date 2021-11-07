const express = require("express");
const router = express.Router();
const security = require("../../security");
const authReplace = require("./auth.replace");
const generateTokenBySession = require("../auth/generateTokenBySession");
const { userModel } = require("../db/mongo");
const { getLoginInfo, logout, login } = require("../auth/login");
const {
  generateNickname,
  generateProfileImageUrl,
} = require("../modules/modifyProfile");

// SPARCS SSO
const Client = require("../auth/sparcsso");
const client = new Client(security.sparcssso_id, security.sparcssso_key);

const transUserData = (userData) => {
  const info = {
    id: userData.uid,
    sid: userData.sid,
    name: userData.first_name + userData.last_name,
    facebook: userData.facebook_id || "",
    twitter: userData.twitter_id || "",
    kaist: userData.kaist_id || "",
    sparcs: userData.sparcs_id || "",
  };

  return info;
};

const joinus = (req, res, userData) => {
  const newUser = new userModel({
    id: userData.id,
    name: userData.name,
    nickname: generateNickname(userData.id),
    profileImageUrl: generateProfileImageUrl(userData.id),
    joinat: Date.now(),
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

router.route("/sparcssso").get((req, res) => {
  const userInfo = getLoginInfo(req);
  const { url, state } = client.getLoginParams();
  req.session.state = state;
  res.redirect(url);
});
router.route("/sparcssso/callback").get((req, res) => {
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
});
router.route("/logout").get((req, res) => {
  logout(req, res);

  // FIXME: redirect는 프론트에서 처리하는게 좋을듯
  res.redirect(security.frontUrl);
});

// 세션의 로그인 정보를 토큰으로 만들어 반환
router.get("/getToken", (req, res) => {
  const userInfo = getLoginInfo(req);
  console.log(userInfo);
  if (!userInfo) {
    return res.status(403).send("not logged in");
  }
  const token = generateTokenBySession(userInfo);

  res.status(200).send(token);
});

module.exports = security.sparcssso_replace ? authReplace : router;
