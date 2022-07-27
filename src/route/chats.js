const express = require("express");

const router = express.Router();
const { chatHandler } = require("../service/chats");

router.use(require("../middleware/apiAccessLog"));

router.get("/:roomId", chatHandler);

module.exports = router;
