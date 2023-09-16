const { Worker } = require("bullmq");
const logger = require("../../modules/logger");

/**
 * 채팅 알림을 전송하는 BullMQ worker를 생성합니다.
 *
 * Redis URI가 주어지지 않으면 worker가 생성되지 않습니다.
 * 이 함수는 workers/ 내에 있는 함수들에 의해서만 사용돼야 합니다.
 * @param {string | undefined} redis - Redis 데이터베이스 URI입니다. (예시: redis://localhost:6379).
 * @param {string} queueName - 서버(producer)와 worker에 의해 사용될 queue의 이름입니다.
 * @param {Function} processor - 작업을 처리할 함수입니다.
 * @param {Function} onCompleted - 작업 성공 시 실행될 함수입니다.
 * @param {Function} onFailed - 작업 실패 시 실행될 함수입니다.
 * @param {object} retention
 * @param {number?} retention.completedJobs - queue에 성공한 작업을 몇 개나 저장할 지를 지정합니다(기본: 1,000).
 * @param {number?} retention.failedJobs - queue에 실패한 작업을 몇 개나 저장할 지를 지정합니다(기본: 5,000).
 * @return {Worker | undefined} - BullMQ worker입니다. redis URI가 주어지지 않으면 undefined를 반환합니다.
 */
const createWorker = (
  redis,
  queueName,
  processor,
  onCompleted,
  onFailed,
  { completedJobs = 1000, failedJobs = 5000 } = {}
) => {
  if (!redis) {
    logger.warn(
      "[WORKERS] Redis URI was not provided so the worker will not work."
    );
    return;
  }
  const worker = new Worker(queueName, processor, {
    connection: redis,
    removeOnComplete: { count: completedJobs },
    removeOnFail: { count: failedJobs },
  });
  worker.on("completed", onCompleted);
  worker.on("failed", onFailed);
  worker.on("error", (err) => {
    logger.error(
      `[WORKERS] worker "${queueName}" failed with following error: ${err}`
    );
  });
  return worker;
};

module.exports = createWorker;
