const express = require("express");
<<<<<<< HEAD
const router = express.Router();
const publicNotice = require("../services/publicNotice");

// 로그인 없이 공지를 볼 수 있습니다.
router.get("/get-recent-transaction", publicNotice.getRecentTransaction);
=======

const router = express.Router();
const publicNoticeHandlers = require("../services/publicNotice");

<<<<<<< HEAD
router.get("/leaderboard", publicNoticeHandlers.getTicketLeaderboardHandler);
>>>>>>> dev
=======
// 상점 공지는 로그인을 요구하지 않습니다.
router.get("/recent-transactions", publicNoticeHandlers.getRecentTransaction);
router.get("/leaderboard", publicNoticeHandlers.getTicketLeaderboardHandler);
>>>>>>> 6148984 (ADD: Merging process...)

module.exports = router;
