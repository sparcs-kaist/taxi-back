const express = require("express");
const router = express.Router();

const transactionsHandlers = require("../services/transactions");

// 아래의 Endpoint 접근 시 로그인 필요
router.use(require("../../middlewares/auth").default);

router.get("/", transactionsHandlers.getUserTransactionsHandler);

module.exports = router;
