const express = require("express");

const router = express.Router();
const globalStateHandlers = require("../services/globalState");
const { validateBody } = require("../../middlewares/ajv");
const globalStateSchema = require("./docs/globalStateSchema");

router.get("/", globalStateHandlers.getUserGlobalStateHandler);

// 아래의 Endpoint 접근 시 로그인 및 시각 체크 필요
router.use(require("../../middlewares/auth"));
router.use(require("../middlewares/timestampValidator"));

router.post(
  "/create",
  validateBody(globalStateSchema.createUserGlobalStateHandler),
  globalStateHandlers.createUserGlobalStateHandler
);

module.exports = router;
