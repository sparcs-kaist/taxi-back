const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const authReplaceHandlers = require("../services/auth.replace");
const authMiddleware = require("../middlewares/auth");
const validator = require("../middlewares/validator");

// 로그인 시도
router.route("/try").post(authReplaceHandlers.tryHandler);

// html 로그인 페이지 쏴주기
router.route("/sparcssso").get(authReplaceHandlers.sparcsssoHandler);

// 로그아웃
router.route("/logout").get(authReplaceHandlers.logoutHandler);

module.exports = router;
