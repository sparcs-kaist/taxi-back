// 프로필 사진을 제공하는 라우터

const express = require("express");
const router = express.Router();
const path = require("path");
const { param, validationResult } = require("express-validator");
const { userModel } = require("../db/mongo");

router.get(
  "/profile-images/:user_id",
  param("user_id").isLength({ min: 1, max: 30 }).isAlphanumeric(),
  async (req, res) => {
    // 입력 데이터 검증
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(404).send("image not found");
      return;
    }

    try {
      const user = await userModel.findOne({ id: req.params.user_id });
      if (user) {
        res.sendFile(path.resolve(user.profileImageUrl));
      } else {
        res.status(404).send("image not found");
      }
    } catch (err) {
      console.log(err);
      res.status(500).send("internal server error");
    }
  }
);

module.exports = router;
