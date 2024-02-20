const express = require("express");

const router = express.Router();
const inviteHandlers = require("../services/invite");

// TODO: Validations

router.get("/search/:inviter", inviteHandlers.searchInviterHandler);

// 아래의 Endpoint 접근 시 로그인, 차단 여부 체크 및 시각 체크 필요
router.use(require("../../middlewares/auth"));
router.use(require("../middlewares/checkBanned"));
router.use(require("../middlewares/timestampValidator"));

router.post("/create", inviteHandlers.createInviteUrlHandler);

module.exports = router;
