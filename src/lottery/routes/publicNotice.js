const express = require("express");

const router = express.Router();
const publicNoticeHandlers = require("../services/publicNotice");

router.get("/leaderboard", publicNoticeHandlers.getGroupLeaderboardHandler);

// 아래의 Endpoint는 2024 봄학기 이벤트에서 사용되지 않습니다.
//
// router.get(
//   "/recentTransactions",
//   publicNoticeHandlers.getRecentPurchaceItemListHandler
// );

module.exports = router;
