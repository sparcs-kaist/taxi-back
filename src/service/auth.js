const security = require("../../security");
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
      kaist: userData.kaist_info?.ku_std_no || "",
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
      profileImageUrl: generateProfileImageUrl(userData.id),
      joinat: Date.now(),
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

module.exports={
    sparcsssoHandler : (req, res) => {
        const userInfo = getLoginInfo(req);
        const { url, state } = client.getLoginParams();
        req.session.state = state;
        res.redirect(url);
      },
    sparcsssoCallbackHandler : (req, res) => {
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
      },
    logoutHandler : (req, res) => {
        logout(req, res);
        res.status(200).send("logged out successfully");
      },
}