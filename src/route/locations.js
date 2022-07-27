const express = require("express");
const router = express.Router();

const { getAllLocationsHandler } = require("../service/locations");

// 로그인된 상태에서만 접근 가능
router.use(require("../middleware/auth"));

// return all locations on GET /
// removes objectID from the result
router.get("/", getAllLocationsHandler);

module.exports = router;
