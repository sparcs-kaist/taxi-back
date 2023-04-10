const express = require("express");

const router = express.Router();
const logininfoHandlers = require("../services/logininfo");

router.route("/").get(logininfoHandlers.logininfoHandler);

// front 작업 이후 미지원 할 API
router.route("/detail").get(logininfoHandlers.logininfoHandler);

module.exports = router;
