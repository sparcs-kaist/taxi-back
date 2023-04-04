const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");
const validator = require("../middlewares/validator");

const authReplaceHandlers = require("../services/auth.replace");

// 로그인 시도
router.post(
  "/try",
  body("id").isString(),
  body("redirect").optional().isString(),
  validator,
  authReplaceHandlers.tryHandler
);

// html 로그인 페이지 쏴주기
router.get(
  "/sparcssso",
  query("redirect").optional().isString(),
  validator,
  authReplaceHandlers.sparcsssoHandler
);

// 로그아웃
router.get(
  "/logout",
  query("redirect").optional().isString(),
  validator,
  authReplaceHandlers.logoutHandler
);

module.exports = router;
