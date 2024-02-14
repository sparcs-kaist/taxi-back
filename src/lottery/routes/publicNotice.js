const express = require("express");
const { eventConfig } = require("../../../loadenv");

const router = express.Router();
const publicNoticeHandlers = require("../services/publicNotice");

router.get("/leaderboard", publicNoticeHandlers.getGroupLeaderboardHandler);

// 아래의 Endpoint는 2023년 가을학기 이벤트 때에만 접근 가능
if (eventConfig.mode === "2023fall") {
  router.get(
    "/recentTransactions",
    publicNoticeHandlers.getRecentPurchaceItemListHandler
  );
}

module.exports = router;
