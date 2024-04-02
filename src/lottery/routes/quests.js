const express = require("express");
const { validateParams } = require("../../middlewares/zod");
const { questsZod } = require("./docs/schemas/questsSchema");
const router = express.Router();
const questsHandlers = require("../services/quests");

// 아래의 Endpoint 접근 시 로그인, 차단 여부 체크 및 시각 체크 필요
router.use(require("../../middlewares/auth"));
router.use(require("../middlewares/checkBanned"));
router.use(require("../middlewares/timestampValidator"));

router.post(
  "/complete/:questId",
  validateParams(questsZod.completeHandler),
  questsHandlers.completeHandler
);

module.exports = router;
