// 프로필 사진을 제공하는 라우터

const express = require("express");
const router = express.Router();
const path = require("path");
const { userModel } = require("../db/mongo");

router.get("/profile-images/:user_id", (req, res) => {
  const user_id = req.params.user_id;
  const idPattern = RegExp("[a-zA-Z0-9_-]{1,20}");
  let filePath = "";

  if (!idPattern.test(user_id)) {
    return res.status(403).send("wrong id");
  }
  userModel
    .findOne({ id: user_id }, (err, user) => {
      if (err || !user) {
        res.status(403).send("such id does not exist");
      } else {
        filePath = user.profileImageUrl;
      }
    })
    .then(() => {
      if (filePath) {
        res.sendFile(path.resolve(filePath));
      }
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
});

module.exports = router;
