const expressSession = require("express-session");
const redis = require("redis");
const MongoStore = require("connect-mongo");
const RedisStore = require("connect-redis")(expressSession);
const {
  redis: redisUrl,
  mongo: mongoUrl,
  session: sessionSecret,
} = require("../../loadenv");
const logger = require("../modules/logger");

// 환경변수 REDIS_PATH 유무에 따라 session 저장 방식이 변경됩니다.
let sessionStore = null;
if (redisUrl) {
  const client = redis.createClient({
    url: redisUrl,
    legacyMode: true,
  });
  client.connect().catch(logger.error);
  sessionStore = new RedisStore({ client });
} else {
  sessionStore = MongoStore.create({ mongoUrl });
}

module.exports = expressSession({
  secret: sessionSecret,
  resave: true,
  saveUninitialized: true,
  store: sessionStore,
});
