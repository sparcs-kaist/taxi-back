const expressSession = require("express-session");
const { nodeEnv, session: sessionConfig } = require("../../loadenv");
const sessionStore = require("@/modules/stores/sessionStore");

module.exports = expressSession({
  secret: sessionConfig.secret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: sessionConfig.expiry,
    secure: nodeEnv === "production",
  },
});
