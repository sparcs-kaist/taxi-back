const express = require("express");
const router = express.Router();

const { chatHandler } = require("../service/chats");

router.get("/:roomId", chatHandler);

module.exports = router;
