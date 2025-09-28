import MongoStore from "connect-mongo";
import RedisStore from "connect-redis";
import { createClient } from "redis";
import {
  redis as redisUrl,
  mongo as mongoUrl,
  session as sessionConfig,
} from "@/loadenv";
import logger from "@/modules/logger";

const getSessionStore = () => {
  // 환경변수 REDIS_PATH 유무에 따라 session 저장 방식이 변경됩니다.
  if (redisUrl) {
    const client = createClient({
      url: redisUrl,
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

export default getSessionStore();
