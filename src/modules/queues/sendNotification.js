const createQueue = require("./helpers/createQueue");
const { redis } = require("../../../loadenv");
const logger = require("../logger");

const queueName = "notifications";
const queue = createQueue(redis, queueName);

/**
 * @param {object} data
 * @param {Array<string>} data.tokens - 메시지 알림을 받을 기기의 deviceToken들로 구성된 Array입니다.
 * @param {string} data.type - 메시지 유형으로, "text" | "in" | "out" | "s3img" | "payment" | "settlement" 입니다.
 * @param {string} data.title - 보낼 메시지의 제목입니다.
 * @param {string} data.body - 보낼 메시지의 본문입니다.
 * @param {string?} data.icon - 메시지를 보낸 사람의 프로필 사진 주소입니다.
 * @param {string?} data.link - 메시지 알림 팝업을 클릭했을 때 이동할 주소입니다.
 */
const addToNotificationQueue = async (data) => {
  const job = await queue?.add(queueName, data);
  if (job) logger.debug("added a job to sendNotification queue");
};

module.exports = {
  addToNotificationQueue,
};
