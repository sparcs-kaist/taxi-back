const express = require("express");
const reportsSchema = require("./docs/schemas/reportsSchema");
const { validateBody } = require("../middlewares/ajv");
const router = express.Router();
const reportHandlers = require("../services/reports");

// 라우터 접근 시 로그인 필요
router.use(require("../middlewares/auth"));

router.post(
  "/create",
  validateBody(reportsSchema.createHandler),
  reportHandlers.createHandler
);

router.get("/searchByUser", reportHandlers.searchByUserHandler);

module.exports = router;
