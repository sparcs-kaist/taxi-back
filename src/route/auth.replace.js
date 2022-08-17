const express = require("express");
const router = express.Router();

const authReplaceHandlers = require("../service/auth.replace");
const setTimestamp = require("../middleware/setTimestamp");

// 로그인 시도
router.route("/try").post(setTimestamp, authReplaceHandlers.tryHandler);

// html 로그인 페이지 쏴주기
router.route("/sparcssso").get(authReplaceHandlers.sparcsssoHandler);

// 로그아웃
router.route("/logout").get(authReplaceHandlers.logoutHandler);

module.exports = router;
