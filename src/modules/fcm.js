var admin = require("firebase-admin");
const logger = require("../modules/logger");

const sendNotificationMultipleUsers = (message, tokens) => {
  const tokenMessage = {
    ...message,
    tokens: tokens,
  };
  return admin
    .messaging()
    .sendMulticast(tokenMessage)
    .then((response) => {
      return response.failureCount;
    });
};

const sendNotification = (message, token) => {
  const tokenMessage = {
    ...message,
    token: token,
  };
  return admin
    .messaging()
    .send(message)
    .then((response) => {
      return true;
    })
    .catch((error) => {
      logger.error(error);
      return false;
    });
};

const sendMessageTopic = (message, topic) => {
  const topicMessage = {
    ...message,
    topic: topic,
  };
  return admin
    .messaging()
    .send(message)
    .then((response) => {
      return true;
    })
    .catch((error) => {
      logger.error(error);
      return false;
    });
};

module.exports = {
  sendNotificationMultipleUsers: sendNotificationMultipleUsers,
  sendNotification: sendNotification,
  sendMessageTopic: sendMessageTopic,
};
