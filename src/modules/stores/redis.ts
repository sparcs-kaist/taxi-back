import { createClient } from "redis";
import { redis as redisUrl } from "@/loadenv";
import logger from "@/modules/logger";

const getRedisClient = () => {
  if (!redisUrl) {
    return undefined;
  }

  const client = createClient({ url: redisUrl });

  // redis client 연결 성공 시 로그를 출력합니다.
  client.on("ready", () => {
    logger.info("Redis session store is connected!");
  });

  // redis client 에러 발생 시 1초에 두 번 재연결을 시도합니다.
  client.on("error", (err) => {
    logger.error(err);
  });

  client.connect().catch(logger.error);
  return client;
};

export const redisClient = getRedisClient();
