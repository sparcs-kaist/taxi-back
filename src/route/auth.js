const express = require("express");
const router = express.Router();
const security = require("../../security");
const authRepace = require("./auth.replace");

// SPARCS SSO
const Client = require("../auth/sparcsso");
const client = new Client(
  security.sparcssso_id,
  security.sparcssso_key
);

module.exports = (mongo, login) => {
  const transUserData = (userData) => {
    const info = {};

    info.id = userData.uid;
    info.sid = userData.sid;
    info.name = userData.first_name + userData.last_name;
    info.facebook = userData.facebook_id || "";
    info.twitter = userData.twitter_id || "";
    info.kaist = userData.kaist_id || "";
    info.sparcs = userData.sparcs_id || "";

    return info;
  };

  const joinus = (req, res, userData, mongo) => {
    const newUser = new mongo.userModel({
      id: userData.id,
      name: userData.name,
      joinat: Date.now(),
    });
    newUser.save((err) => {
      if (err) {
        loginFalse(req, res);
        return;
      }
      loginDone(req, res, userData, mongo);
    });
  };
  const update = async (req, res, userData, mongo) => {
    const updateInfo = { name: userData.name };
    await mongo.userModel.updateOne({ id: userData.id }, updateInfo);
    loginDone(req, res, userData, mongo);
  };
  const loginDone = (req, res, userData, mongo) => {
    mongo.userModel.findOne(
      { id: userData.id },
      "name id withdraw ban",
      (err, result) => {
        if (err) loginFalse(req, res);
        else if (!result) joinus(req, res, userData, mongo);
        else if (result.name != userData.name)
          update(req, res, userData, mongo);
        else {
          login.login(req, userData.sid, result.id, result.name);
          res.redirect(security.frontUrl + "/");
        }
      }
    );
  };
  const loginFalse = (req, res) => {
    res.redirect(security.frontUrl + "/login/false"); // 리엑트로 연결되나?
  };

  router.route("/sparcssso").get((req, res) => {
    const userInfo = login.getLoginInfo(req);
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
        loginDone(req, res, userData, mongo);
      });
    }
  });
  router.route("/logout").get((req, res) => {
    login.logout(req);
    res.redirect(security.frontUrl);
  });

  if (security.sparcssso_replace == "true") return authRepace(mongo, login);
  else return router;
};
