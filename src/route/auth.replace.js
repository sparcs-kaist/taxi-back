const express = require("express");
const router = express.Router();
const ejs = require("ejs");
const security = require("../../security");
const mongo = require("../db/mongo");
const generateTokenBySession = require("../auth/generateTokenBySession");
const generateNickname = require("../modules/generateNickname");

const loginHtml = `
<!DOCTYPE html>
<html lang="ko">
    <head>
        <title>replace Login</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0,minium-scale=1.0,maxinum-scale=1.0,user-scalable=no" />
        <script  src="http://code.jquery.com/jquery-latest.min.js"></script>
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
                $('#btn').click(() => {
                    const value = document.getElementById("input-id").value;
                    console.log(value);
                    if(value) post('/auth/try', { id: value });
                });
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

module.exports = (mongo, login) => {
  const makeInfo = (id) => {
    const info = {};
    info.id = id;
    info.sid = id + "-sid";
    info.name = id + "-name";
    info.nickname = generateNickname(id);
    info.facebook = id + "-facebook";
    info.twitter = id + "-twitter";
    info.kaist = id + "-kaist";
    info.sparcs = id + "-sparcs";
    return info;
  };

  // 새로운 유저 만들기
  // 이거 왜 이름이 joinus?
  const joinus = (req, res, userData) => {
    const newUser = new mongo.userModel({
      id: userData.id,
      name: userData.name,
      nickname: userData.nickname,
      joinat: Date.now(),
      subinfo: {
        kaist: userData.kaist,
        sparcs: userData.sparcs,
        facebook: userData.facebook,
        twitter: userData.twitter,
      },
    });
    newUser.save((err) => {
      if (err) {
        console.log("login > usersave error");
        return;
      }
      loginDone(req, res, userData);
    });
  };

  // 주어진 데이터로 DB 검색
  // 만약 없으면 새로운 유저 만들기
  // 있으면 로그인 진행 후 리다이렉트
  const loginDone = (req, res, userData) => {
    mongo.userModel.findOne(
      { id: userData.id },
      "name id withdraw ban",
      (err, result) => {
        if (err) console.log("login > done error");
        else if (!result) joinus(req, res, userData, mongo);
        else {
          login.login(req, userData.sid, result.id, result.name);
          res.send("successful");
        }
      }
    );
  };

  // 로그인 시도
  router.route("/try").post((req, res) => {
    {
      const id = req.body.id || req.query.id;
      loginDone(req, res, makeInfo(id));
    }
  });

  // html 로그인 페이지 쏴주기
  router.route("/sparcssso").get((req, res) => {
    res.end(loginHtml);
  });

  router.route("/logout").get((req, res) => {
    // FIXME: 리다이렉트는 프론트에서 처리하도록 하는게 좋을듯
    login.logout(req, res);
    res.redirect(security.frontUrl);
  });

  // 세션의 로그인 정보를 토큰으로 만들어 반환
  router.get("/getToken", (req, res) => {
    const userInfo = login.getLoginInfo(req);
    if (!userInfo.id || !userInfo.name || !userInfo.sid) {
      return res.status(403).send("not logged in");
    }
    const token = generateTokenBySession(userInfo);

    res.status(200).send(token);
  });
  return router;
};
