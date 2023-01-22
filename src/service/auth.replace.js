const security = require("../../security");
const { userModel } = require("../db/mongo");
const { logout, login } = require("../auth/login");
const {
  generateNickname,
  generateProfileImageUrl,
} = require("../modules/modifyProfile");
const logger = require("../modules/logger");

const loginHtml = `
<!DOCTYPE html>
<html lang="ko">
    <head>
        <title>replace Login</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0,minium-scale=1.0,maxinum-scale=1.0,user-scalable=no" />
        <script src="https://code.jquery.com/jquery-latest.min.js"></script>
        <script>
            $(document).ready(function(){
                function post(path, params){
                    var form = document.createElement("form");
                    form.setAttribute("method", "post");
                    form.setAttribute("action", path);
                    for(var key in params) {
                        var hiddenField = document.createElement("input");
                        hiddenField.setAttribute("type", "hidden");
                        hiddenField.setAttribute("name", key);
                        hiddenField.setAttribute("value", params[key]);
                        form.appendChild(hiddenField);
                    }
                    document.body.appendChild(form);
                    form.submit();
                }
                const submitHandler = () => {
                    const value = document.getElementById("input-id").value;
                    if(value) post('/auth/try', { id: value });
                }
                const enterHandler = (e) => {
                    if (e.keyCode === 13) submitHandler();
                }
                $('#btn').click(submitHandler);
                $('#input-id').on("keyup", enterHandler);
            });
        </script>
    </head>
    <body>
        <div>아이디 입력</div>
        <input id="input-id">
        <div id="btn">로그인</div>
    </body>
</html>
`;

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
const joinus = (req, res, userData) => {
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
    loginDone(req, res, userData);
  });
};

// 주어진 데이터로 DB 검색
// 만약 없으면 새로운 유저 만들기
// 있으면 로그인 진행 후 리다이렉트
const loginDone = (req, res, userData) => {
  userModel.findOne(
    { id: userData.id },
    "name id withdraw ban",
    (err, result) => {
      if (err) logger.error(logger.error(err));
      else if (!result) joinus(req, res, userData);
      else {
        login(req, userData.sid, result.id, result.name);
        // res.send("successful"); //API 테스트용 코드(프론트 리다이렉트 X)
        res.redirect(security.frontUrl);
      }
    }
  );
};

const tryHandler = (req, res) => {
  {
    const id = req.body.id || req.query.id;
    loginDone(req, res, makeInfo(id));
  }
};

const sparcsssoHandler = (req, res) => {
  res.end(loginHtml);
};

const logoutHandler = (req, res) => {
  try {
    const ssoLogoutUrl = security.frontUrl + "/login";
    logout(req, res);
    res.json({ ssoLogoutUrl });
  } catch (e) {
    res.status(500).send("Auth/logout : internal server error");
  }
};

module.exports = {
  tryHandler,
  sparcsssoHandler,
  logoutHandler,
};
