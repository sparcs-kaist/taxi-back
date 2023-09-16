const createWorker = require("./helpers/createWorker");
const logger = require("../modules/logger");
const { initializeApp, sendMessageByTokens } = require("../modules/fcm");
const { redis } = require("../../loadenv");

// Firebase Admin 초기설정
initializeApp();

const queueName = "notifications";

/**
 * @param {object} job
 * @param {string | undefined} job.id
 * @param {object} job.data
 * @param {Array<string>} job.data.tokens - 메시지 알림을 받을 기기의 deviceToken들로 구성된 Array입니다.
 * @param {string} job.data.type - 메시지 유형으로, "text" | "in" | "out" | "s3img" | "payment" | "settlement" 입니다.
 * @param {string} job.data.title - 보낼 메시지의 제목입니다.
 * @param {string} job.data.body - 보낼 메시지의 본문입니다.
 * @param {string?} job.data.icon - 메시지를 보낸 사람의 프로필 사진 주소입니다.
 * @param {string?} job.data.link - 메시지 알림 팝업을 클릭했을 때 이동할 주소입니다.
 */
const processor = async (job) => {
  const { tokens, type, title, body, icon, link } = job.data;
  return await sendMessageByTokens(tokens, type, title, body, icon, link);
};

const onCompleted = (job, failureCounts) => {
  logger.debug(`[WORKERS] job id ${job.id} completed; ${failureCounts} failed`);
};

const onFailed = (job, err) => {
  logger.error(
    `[WORKERS] job id ${job.id} failed with following error: ${err}`
  );
};

const worker = createWorker(redis, queueName, processor, onCompleted, onFailed);

module.exports = worker;
