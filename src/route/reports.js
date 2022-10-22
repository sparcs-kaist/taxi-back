const express = require("express");
const { body } = require("express-validator");
const validator = require("../middleware/validator");

const router = express.Router();
const reportHandlers = express.Router("../service/reports");

router.post(
  "/report",
  [
    body("reportedId").isMongoId(),
    body("type").isIn(["no-settlement", "no-show", "etc-reason"]),
    body("etcDetail").optional().isString().isLength({ max: 30 }),
    body("time").isISO8601(),
  ],
  validator,
  reportHandlers.reportHandler
);

// router.get("/getReportByUser");

module.exports = router;
