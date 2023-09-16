const logger = require("./src/modules/logger");

// BullMQ worker들을 등록합니다.
const workers = [require("./src/workers/sendNotification")];

// 오류 발생 시 로깅합니다.
process.on("uncaughtException", function (err) {
  logger.error(`핸들링되지 않은 예외 발생: ${err}`);
});

// 오류 발생 시 로깅합니다.
process.on("unhandledRejection", (err) => {
  logger.error(`Promise에서 핸들링되지 않은 rejection 발생: ${err}`);
});

// 프로세스가 종료될 때 worker를 안전하게 종료합니다.
process.on("SIGINT", async () => {
  await Promise.all(workers.map(async (worker) => await worker?.close()));
  logger.info("[WORKERS] worker 프로세스가 종료되었습니다.");
});

logger.info("[WORKERS] worker 프로세스가 시작되었습니다.");
