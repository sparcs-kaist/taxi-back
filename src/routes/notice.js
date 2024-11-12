const express = require("express");

const { getNotices } = require("../services/notice");

const router = express.Router();

router.get("/list", getNotices);

module.exports = router;
