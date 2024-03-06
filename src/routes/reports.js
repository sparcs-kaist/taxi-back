const express = require("express");
const { validateBody } = require("../middlewares/zod");
const { reportsZod } = require("./docs/schemas/reportsSchema");
const router = express.Router();
const reportHandlers = require("../services/reports");

// 라우터 접근 시 로그인 필요
router.use(require("../middlewares/auth"));

router.post(
  "/create",
  validateBody(reportsZod.createHandler),
  reportHandlers.createHandler
);

router.get("/searchByUser", reportHandlers.searchByUserHandler);

module.exports = router;
