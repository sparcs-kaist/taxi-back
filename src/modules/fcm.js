const { getMessaging } = require("firebase-admin/messaging");
const logger = require("../modules/logger");

const sendNotificationMultipleUsers = async (data, tokens) => {
  try {
    const tokenMessage = {
      data,
      tokens,
    };
    const { failureCount } = await getMessaging().sendMulticast(tokenMessage);
    return failureCount;
  } catch (error) {
    logger.error(error);
    return -1;
  }
};

const sendNotification = async (data, token) => {
  try {
    const tokenMessage = {
      data,
      token,
    };
    console.log(tokenMessage);
    await getMessaging().send(tokenMessage);
    logger.info(`Notification sent to token ${token}`);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

const sendMessageTopic = async (data, topic) => {
  try {
    const topicMessage = {
      data,
      topic,
    };
    await getMessaging().send(topicMessage);
    logger.info(`Notification sent to topic ${topic}`);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

// We need more helper functions, right?

module.exports = {
  sendNotificationMultipleUsers,
  sendNotification,
  sendMessageTopic,
};
