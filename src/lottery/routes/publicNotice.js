const express = require("express");

const router = express.Router();
const publicNoticeHandlers = require("../services/publicNotice");

// 상점 공지는 로그인을 요구하지 않습니다.
router.get(
  "/recentTransactions",
  publicNoticeHandlers.getRecentPurchaceItemListHandler
);
router.get("/leaderboard", publicNoticeHandlers.getGroupLeaderboardHandler);

module.exports = router;
