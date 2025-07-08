import { createClient, type RedisClientType } from "redis";
import { redis as redisUrl } from "@/loadenv";
import logger from "@/modules/logger";

let redisClient: RedisClientType | undefined;

const getRedisClient = () => {
  if (redisClient || !redisUrl) {
    return redisClient;
  }

  redisClient = createClient({ url: redisUrl });
  redisClient.on("ready", () => {
    // redis client 연결 성공 시 로그를 출력합니다.
    logger.info("Redis session store is connected!");
  });
  redisClient.on("error", (err) => {
    // redis client 에러 발생 시 1초에 두 번 재연결을 시도합니다.
    logger.error(err);
  });
  redisClient.connect().catch(logger.error);
  return redisClient;
};

export default getRedisClient();
