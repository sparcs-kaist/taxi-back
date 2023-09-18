const express = require("express");

const router = express.Router();
const globalStateHandlers = require("../services/globalState");
const auth = require("../../middlewares/auth");

router.get("/", globalStateHandlers.getUserGlobalStateHandler);
router.post("/create", auth, globalStateHandlers.createUserGlobalStateHandler);

module.exports = router;
