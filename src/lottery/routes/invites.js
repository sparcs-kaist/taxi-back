const express = require("express");
const router = express.Router();

const { validateParams } = require("../../middlewares/zod");
const { invitesZod } = require("./docs/schemas/invitesSchema");
const invitesHandlers = require("../services/invites");

router.get(
  "/search/:inviter",
  validateParams(invitesZod.searchInviterHandler),
  invitesHandlers.searchInviterHandler
);

// 아래의 Endpoint 접근 시 로그인, 차단 여부 및 시각 체크 필요
router.use(require("../../middlewares/auth").default);
router.use(require("../middlewares/eventValidator").default);
router.use(require("../middlewares/timestampValidator"));

router.post("/create", invitesHandlers.createInviteUrlHandler);

module.exports = router;
