const express = require("express");
const router = express.Router();
const logininfoHandlers = require("../service/logininfo")

router.route("/").get(logininfoHandlers.logininfoHandler);

router.route("/detail").get(logininfoHandlers.detailHandler);

module.exports = router;
