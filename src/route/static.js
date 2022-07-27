// 프로필 사진을 제공하는 라우터
const express = require("express");
const router = express.Router();
const { param } = require("express-validator");
const staticHandlers = require("../service/static");

router.get(
  "/profile-images/:user_id",
  param("user_id").isLength({ min: 1, max: 30 }).isAlphanumeric(),
  staticHandlers.profileHandler
);

module.exports = router;
