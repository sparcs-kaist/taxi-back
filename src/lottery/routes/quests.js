const express = require("express");

const router = express.Router();
const questsHandlers = require("../services/quests");

const { validateParams } = require("../../middlewares/ajv");
const questsSchema = require("./docs/questsSchema");

router.use(require("../../middlewares/auth"));
router.use(require("../middlewares/blockedList"));
router.use(require("../middlewares/timestampValidator"));

router.post(
  "/complete/:questId",
  validateParams(questsSchema.completeHandler),
  questsHandlers.completeHandler
);

module.exports = router;
