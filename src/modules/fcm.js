var admin = require("firebase-admin");
const logger = require("../modules/logger");

/**
 * FCM 토큰이 현재 유효한지 IID 엔드포인트에 요청을 보냄으로써 검증하는 함수입니다.
 * @param {string} deviceToken - 검증할 FCM 디바이스 토큰입니다.
 * @return {Promise<Boolean>} 토큰이 현재 유효한 경우 true, 아닌 경우 false를 반환합니다.
 */
const validateDeviceToken = async (deviceToken) => {
  try {
    // Check if the status code is 200. If 400 or 404, then the token is not valid.
    const response = await fetch(
      `https://https://iid.googleapis.com/iid/info/${deviceToken}?details=true`
    );
    if (response.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const sendNotificationMultipleUsers = async (message, tokens) => {
  try {
    const tokenMessage = {
      ...message,
      tokens: tokens,
    };
    const { failureCount } = await admin
      .messaging()
      .sendMulticase(tokenMessage);
    return failureCount;
  } catch (error) {
    logger.error(error);
    return -1;
  }
};

const sendNotification = async (message, token) => {
  try {
    const tokenMessage = {
      ...message,
      token: token,
    };
    const response = await admin.messaging.send(tokenMessage);
    logger.info(`Notification sent to token ${token}`);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

const sendMessageTopic = async (message, topic) => {
  try {
    const topicMessage = {
      ...message,
      topic: topic,
    };
    const response = await admin.messaging.send(topicMessage);
    logger.info(`Notification sent to topic ${topic}`);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

module.exports = {
  validateDeviceToken,
  sendNotificationMultipleUsers,
  sendNotification,
  sendMessageTopic,
};
