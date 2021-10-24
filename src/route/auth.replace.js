const express = require("express");
const router = express.Router();
const ejs = require("ejs");
const security = require("../../security");

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
    info.facebook = id + "-facebook";
    info.twitter = id + "-twitter";
    info.kaist = id + "-kaist";
    info.sparcs = id + "-sparcs";
    return info;
  };

  const joinus = (req, res, userData, mongo) => {
    const newUser = new mongo.userModel({
      id: userData.id,
      name: userData.name,
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
      loginDone(req, res, userData, mongo);
    });
  };
  const loginDone = (req, res, userData, mongo) => {
    mongo.userModel.findOne(
      { id: userData.id },
      "name id withdraw ban",
      (err, result) => {
        if (err) console.log("login > done error");
        else if (!result) joinus(req, res, userData, mongo);
        else {
          login.login(req, userData.sid, result.id, result.name);
          res.redirect(security.frontUrl + "/");
        }
      }
    );
  };

  router.route("/try").post((req, res) => {
    {
      const id = req.body.id || req.query.id;
      loginDone(req, res, makeInfo(id), mongo);
    }
  });
  router.route("/sparcssso").get((req, res) => {
    res.end(loginHtml);
  });
  router.route("/logout").get((req, res) => {
    login.logout(req);
    res.redirect(security.frontUrl);
  });
  return router;
};
