const express = require("express");
const router = express.Router();
const publicNoticeHandlers = require("../services/publicNotice");

// 상점 공지 이용은 로그인을 요구하지 않습니다.
router.get(
  "/get-recent-transaction",
  publicNoticeHandlers.getRecentTransaction
);

module.exports = router;
