const express = require("express");

const router = express.Router();
const logininfoHandlers = require("@/services/logininfo");

router.route("/").get(logininfoHandlers.logininfoHandler);

module.exports = router;
