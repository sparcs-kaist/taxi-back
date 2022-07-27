const express = require("express");
const security = require("../../security");
const authReplace = require("./auth.replace");

const router = express.Router();
const authHandlers = require("../service/auth");

router.use(require("../middleware/apiAccessLog"));

router.route("/sparcssso").get(authHandlers.sparcsssoHandler);
router.route("/sparcssso/callback").get(authHandlers.sparcsssoCallbackHandler);
router.route("/logout").get(authHandlers.logoutHandler);

module.exports = security.sparcssso_replace ? authReplace : router;
