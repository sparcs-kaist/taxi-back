const express = require("express");

const router = express.Router();
const publicNoticeHandlers = require("../services/publicNotice");

// 아래의 Endpoint들은 2025 봄 이벤트에서 사용되지 않습니다.
//
// router.get("/leaderboard", publicNoticeHandlers.getGroupLeaderboardHandler);

// router.get(
//   "/recentTransactions",
//   publicNoticeHandlers.getRecentPurchaceItemListHandler
// );

module.exports = router;
