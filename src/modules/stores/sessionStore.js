const expressSession = require("express-session");
const redis = require("redis");
const MongoStore = require("connect-mongo");
const RedisStore = require("connect-redis")(expressSession);
const {
  redis: redisUrl,
  mongo: mongoUrl,
  session: sessionConfig,
} = require("@/loadenv");
const logger = require("@/modules/logger");

const getSessionStore = (redisUrl) => {
  // 환경변수 REDIS_PATH 유무에 따라 session 저장 방식이 변경됩니다.
  if (redisUrl) {
    const client = redis.createClient({
      url: redisUrl,
      legacyMode: true,
    });

    // redis client 연결 성공 시 로그를 출력합니다.
    client.on("ready", () => {
      logger.info("Redis session store is connected!");
    });

    // redis client 에러 발생 시 1초에 두 번 재연결을 시도합니다.
    client.on("error", (err) => {
      logger.error(err);
    });

    client.connect().catch(logger.error);
    return new RedisStore({ client, ttl: sessionConfig.expiry });
  } else {
    return MongoStore.create({ mongoUrl });
  }
};

module.exports = getSessionStore(redisUrl);
