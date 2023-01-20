const express = require("express");
const path = require("path");

const router = express.Router();

// Requires admin property of the user to enter admin page.
router.use(require("../middleware/adminAuth"));

// Log 파일 제공
router.use(express.static(path.join(process.env.PWD, "logs")));

module.exports = router;
