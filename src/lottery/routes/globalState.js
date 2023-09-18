const express = require("express");

const router = express.Router();
const globalStateHandlers = require("../services/globalState");

// 라우터 접근 시 로그인 필요
router.use(require("../../middlewares/auth"));

router.get("/", globalStateHandlers.getUserGlobalStateHandler);
router.post("/create", globalStateHandlers.createUserGlobalStateHandler);

module.exports = router;
