const express = require("express");

const router = express.Router();
const locationsHandlers = require("../service/locations");

// 라우터 접근 시 로그인 필요
router.use(require("../middleware/auth"));

router.get("/", locationsHandlers.getAllLocationsHandler);

module.exports = router;
