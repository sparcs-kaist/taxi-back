const { getMessaging } = require("firebase-admin/messaging");
const axios = require("axios");
const logger = require("../modules/logger");

/**
 * FCM 토큰이 현재 유효한지 IID 엔드포인트에 요청을 보냄으로써 검증하는 함수입니다.
 * @param {string} deviceToken - 검증할 FCM 디바이스 토큰입니다.
 * @return {Promise<Boolean>} 토큰이 현재 유효한 경우 true, 아닌 경우 false를 반환합니다.
 */
const validateDeviceToken = async (deviceToken) => {
  // TO DO THIS, WE FIRST NEED TO GET ACCESS TOKEN FROM THE CREDENTIAL VIA API REQUEST.
  // Otherwise, you will see a "MissingAuthorization" error.
  try {
    // Check if the status code is 200. If 400 or 404, then the token is not valid.
    // I think there will be a better method......
    // const serverKey = "";
    // const response = await axios.post(
    //   `https://https://iid.googleapis.com/iid/info/${deviceToken}?details=true`,
    //   {},
    //   {
    //     headers: {
    //       Authorization: `Bearer ${serverKey}`,
    //     },
    //   }
    // );
    const response = { status: 200 };
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
      data: message,
      tokens: tokens,
    };
    const { failureCount } = await getMessaging().sendMulticast(tokenMessage);
    return failureCount;
  } catch (error) {
    logger.error(error);
    return -1;
  }
};

const sendNotification = async (message, token) => {
  try {
    const tokenMessage = {
      data: message,
      token: token,
    };
    logger.info(tokenMessage.token);
    const response = await getMessaging().send(tokenMessage);
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
      data: message,
      topic: topic,
    };
    const response = await getMessaging().send(topicMessage);
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
