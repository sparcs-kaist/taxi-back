const express = require("express");
<<<<<<< HEAD
const router = express.Router();
const publicNotice = require("../services/publicNotice");

// 로그인 없이 공지를 볼 수 있습니다.
router.get("/get-recent-transaction", publicNotice.getRecentTransaction);
=======

const router = express.Router();
const publicNoticeHandlers = require("../services/publicNotice");

router.get("/leaderboard", publicNoticeHandlers.getTicketLeaderboardHandler);
>>>>>>> dev

module.exports = router;
