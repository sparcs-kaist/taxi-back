const { Queue } = require("bullmq");
const logger = require("../../logger");

/**
 * 서버(producer)에서 사용할 BullMQ queue를 생성합니다.
 * 서버(producer)에서 queue에 추가한 작업은 worker process에 의해 처리됩니다.
 * 이 함수는 queues/ 내에 있는 함수들에 의해서만 사용돼야 합니다.
 * @param {string | undefined} redis - Redis 데이터베이스 URI입니다. (예시: redis://localhost:6379).
 * @param {string} queueName - 서버(producer)와 worker에 의해 사용될 queue의 이름입니다.
 * @return {Queue | undefined} - BullMQ queue 객체입니다. redis URI가 주어지지 않으면 undefined를 반환합니다.
 */
const createQueue = (redis, queueName) => {
  if (!redis) {
    logger.warn(
      "[QUEUES] Redis URI was not provided so the job queue will not work."
    );
    return;
  }
  const queue = new Queue(queueName, {
    connection: redis,
  });
  queue.on("error", (err) => {
    logger.error(
      `[QUEUES] job queue "${queueName}" failed with following error: ${err}`
    );
  });
  logger.info(`[QUEUES] job queue "${queueName}" was created`);
  return queue;
};

module.exports = createQueue;
