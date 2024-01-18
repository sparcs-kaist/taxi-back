const express = require("express");

const router = express.Router();
const healthCheckHandlers = require("../services/hc");

router.get("/", healthCheckHandlers.healthCheckHandler);

module.exports = router;
