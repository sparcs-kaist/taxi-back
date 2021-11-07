// 프로필 사진을 제공하는 라우터

const express = require("express");
const router = express.Router();
const path = require("path");
const { userModel } = require("../db/mongo");

router.get("/profile-images/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  const idPattern = RegExp("[a-zA-Z0-9_-]{1,20}");

  if (!idPattern.test(user_id)) {
    res.status(404).send("image not found");
  }

  try {
    user = await userModel.findOne({ id: user_id });
    if (user) {
      res.sendFile(path.resolve(user.profileImageUrl));
    } else {
      res.status(404).send("image not found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("static/profile-images: internal server error");
  }
});

module.exports = router;
