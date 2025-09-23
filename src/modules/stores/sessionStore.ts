import MongoStore from "connect-mongo";
import RedisStore from "connect-redis";
import { mongo as mongoUrl, session as sessionConfig } from "@/loadenv";
import { redisClient } from "./redis";

const getSessionStore = () => {
  // 환경변수 REDIS_PATH 유무에 따라 session 저장 방식이 변경됩니다.
  if (redisClient) {
    return new RedisStore({ client: redisClient, ttl: sessionConfig.expiry });
  } else {
    return MongoStore.create({ mongoUrl });
  }
};

export default getSessionStore();
