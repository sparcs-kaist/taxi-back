const express = require("express");

const router = express.Router();
const itemsHandlers = require("../services/items");

router.get("/list", itemsHandlers.listHandler);

module.exports = router;
