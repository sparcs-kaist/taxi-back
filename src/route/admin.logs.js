const express = require("express");

const router = express.Router();

// Requires admin property of the user to enter admin page.
router.use(require("../middleware/adminAuth"));

// Log 파일 제공
router.use(express.static(__dirname + '/logs'));

module.exports = router;
