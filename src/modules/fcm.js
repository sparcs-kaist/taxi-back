var admin = require("firebase-admin");
const logger = require("../modules/logger");

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
  sendNotificationMultipleUsers: sendNotificationMultipleUsers,
  sendNotification: sendNotification,
  sendMessageTopic: sendMessageTopic,
};
