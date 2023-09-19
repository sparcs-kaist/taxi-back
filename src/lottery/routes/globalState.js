const express = require("express");

const router = express.Router();
const globalStateHandlers = require("../services/globalState");
const { validateBody } = require("../../middlewares/ajv");

router.get("/", globalStateHandlers.getUserGlobalStateHandler);

// 아래의 Endpoint 접근 시 로그인 필요
router.use(require("../../middlewares/auth"));

router.post("/create",
  validateBody(globalStateHandlers.createUserGlobalStateSchema),
  globalStateHandlers.createUserGlobalStateHandler);

module.exports = router;
