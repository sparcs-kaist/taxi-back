const express = require("express");
const security = require("../../security");
const authReplace = require("./auth.replace");

const router = express.Router();
const authHandlers = require("../service/auth");

router.route("/sparcssso").get(authHandlers.sparcsssoHandler);
router.route("/sparcssso/callback").get(authHandlers.sparcsssoCallbackHandler);
router.route("/logout").get(authHandlers.logoutHandler);

// 환경변수 SPARCSSSO_CLIENT_ID 유무에 따라 로그인 방식이 변경됩니다.
module.exports = security.sparcssso?.id ? router : authReplace;
