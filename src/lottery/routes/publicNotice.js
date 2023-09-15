const express = require("express");
const router = express.Router();
const publicNotice = require("../services/publicNotice");

// 상점이용은 로그인을 요구합니다.
router.use(require("../../middlewares/auth"));
router.get("/get-recent-transaction", publicNotice.getRecentTransaction);

module.exports = router;
