const express = require("express");
const { body } = require("express-validator");
const validator = require("../middleware/validator");

const router = express.Router();
const reportHandlers = require("../service/reports");

// 라우터 접근 시 로그인 필요
router.use(require("../middleware/auth"));

router.post(
  "/create",
  [
    body("reportedId").isMongoId(),
    body("type").isIn(["no-settlement", "no-show", "etc-reason"]),
    body("etcDetail").optional().isString().isLength({ max: 30 }),
    body("time").isISO8601(),
  ],
  validator,
  reportHandlers.createHandler
);

router.get("/searchByUser", reportHandlers.searchByUserHandler);

module.exports = router;
