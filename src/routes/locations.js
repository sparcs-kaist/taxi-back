const express = require("express");

const router = express.Router();
const locationsHandlers = require("../services/locations");

router.get("/", locationsHandlers.getAllLocationsHandler);

module.exports = router;
