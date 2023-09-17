const express = require("express");

const router = express.Router();
const publicNoticeHandlers = require("../services/publicNotice");

router.get("/leaderboard", publicNoticeHandlers.getTicketLeaderboardHandler);

module.exports = router;
