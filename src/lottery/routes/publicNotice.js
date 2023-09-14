const express = require("express");

const router = express.Router();
const publicNoticeHandlers = require("../services/publicNotice");
const auth = require("../../middlewares/auth");

router.get(
  "/leaderboard",
  auth,
  publicNoticeHandlers.getTicketLeaderboardHandler
);

module.exports = router;
