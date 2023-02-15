const { getMessaging } = require("firebase-admin/messaging");
const { deviceTokenModel, topicSubscriptionModel } = require("../db/mongo");
const logger = require("../modules/logger");

/**
 * 사용자의 ObjectId와 FCM device token이 주어졌을 때, 해당 deviceToken을 사용자의 토큰으로 DB에 등록합니다.
 * @param {string} userId - 사용자의 ObjectId입니다.
 * @param {string} deviceToken - 등록하려는 FCM device token입니다.
 * @return {Promise<Array<string>>} 변경된 사용자의 deviceToken의 목록 Array를 반환합니다. 오류가 발생하면 빈 배열을 반환합니다.
 */
const registerDeviceToken = async (userId, deviceToken) => {
  try {
    const newDeviceToken = await deviceTokenModel.updateOne(
      {
        userId,
      },
      {
        userId,
        $addToSet: { deviceToken },
      },
      { upsert: true, new: true }
    );
    return newDeviceToken.deviceToken;
  } catch (error) {
    logger.error(error);
    return new Array();
  }
};

/**
 * 사용자의 ObjectId와 FCM device token이 주어졌을 때, 해당 사용자의 해당 deviceToken을 DB에서 삭제합니다.
 * @param {string} userId - 사용자의 ObjectId입니다.
 * @param {string} deviceToken - 삭제하려는 FCM device token입니다.
 * @return {Promise<Array<string>>} 변경된 사용자의 deviceToken의 목록 Array를 반환합니다. 오류가 발생하면 빈 배열을 반환합니다.
 */
const unregisterDeviceToken = async (userId, deviceToken) => {
  try {
    const newDeviceToken = await deviceTokenModel.updateOne(
      {
        userId,
      },
      {
        userId,
        $pull: { deviceToken },
      },
      { upsert: true, new: true }
    );
    return newDeviceToken.deviceToken;
  } catch (error) {
    logger.error(error);
    return new Array();
  }
};

/**
 * 사용자들의 ObjectId의 배열이 주어졌을 때, 해당 사용자들의 모든 deviceToken을 하나의 Array로 반환합니다.
 * @param {Array<string>} userIds - 사용자의 ObjectId로 이루어진 Array입니다.
 * @return {Promise<Array<string>>} deviceToken의 Array를 반환합니다. 오류가 발생하면 빈 배열을 반환합니다.
 */
const getTokensOfUsers = async (userIds) => {
  const deviceTokenOfUsers = await Promise.all(
    userIds.map(async (userId) => {
      const deviceToken = await deviceTokenModel.findOne({
        userId,
      });
      return deviceToken.deviceToken;
    })
  );
  return deviceTokenOfUsers.reduce(
    (arrayA, arrayB) => arrayA.concat(arrayB),
    new Array()
  );
};

/**
 * 주어진 token에 해당하는 기기에 data를 전송합니다.
 * @param {string} token - 알림을 받을 기기의 deviceToken입니다.
 * @param {Object} data - 기기에 전송할 key-value pair입니다. 모든 value는 string 타입이어야 합니다.
 * @return {Promise<boolean>} data 전송에 성공했으면 true, 아니면 false를 반환합니다.
 */
const sendNotificationByToken = async (data, token) => {
  try {
    const message = {
      data,
      token,
    };
    await getMessaging().send(message);
    logger.info(`Notification sent to token ${token}`);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

/**
 * 주어진 token들에 해당하는 기기들에 data를 전송합니다.
 * @param {Array<string>} tokens - 알림을 받을 기기들의 deviceToken들입니다.
 * @param {Object} data - 기기에 전송할 key-value pair입니다. 모든 value는 string 타입이어야 합니다.
 * @return {Promise<boolean>} data 전송에 성공한 기기의 수를 반환합니다. 오류가 발생하면 -1을 반환합니다.
 */
const sendNotificationByTokens = async (data, tokens) => {
  try {
    if (tokens.length === 0) return -1;
    const message = {
      data,
      tokens,
    };
    const { failureCount } = await getMessaging().sendMulticast(message);
    return failureCount;
  } catch (error) {
    logger.error(error);
    return -1;
  }
};

/**
 * 주어진 topic을 구독하고 있는 모든 기기에 data를 전송합니다.
 * @param {string} token - data를 보낼 기기들이 구독하고 있는 topic입니다.
 * @param {Object} data - 기기에 전송할 key-value pair입니다. 모든 value는 string 타입이어야 합니다.
 * @return {Promise<boolean>} data 전송에 성공했으면 true, 아니면 false를 반환합니다.
 */
const sendNotificationByTopic = async (data, topic) => {
  try {
    const message = {
      data,
      topic,
    };
    await getMessaging().send(message);
    logger.info(`Notification sent to topic ${topic}`);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

/**
 * 주어진 token에 메시지 알림을 전송합니다.
 * @param {string} token - 메시지 알림을 받을 기기의 deviceToken입니다.
 * @param {string} title - 보낼 메시지의 제목입니다.
 * @param {string} body - 보낼 메시지의 본문입니다.
 * @param {string} icon - 메시지를 보낸 사람의 프로필 사진 주소입니다.
 * @param {string?} url - 메시지 알림 팝업을 클릭했을 때 이동할 주소입니다.
 * @return {Promise<boolean>} 메시지 알림 전송에 성공했으면 true, 아니면 false를 반환합니다.
 */
const sendMessageByToken = async (token, title, body, icon, url) => {
  url = url || "/myroom";
  const data = { title, body, icon, url };
  return await sendNotificationByToken(data, token);
};

/**
 * 주어진 token들에 메시지 알림을 전송합니다.
 * @param {Array<string>} tokens - 메시지 알림을 받을 기기의 deviceToken들로 구성된 Array입니다.
 * @param {string} title - 보낼 메시지의 제목입니다.
 * @param {string} body - 보낼 메시지의 본문입니다.
 * @param {string} icon - 메시지를 보낸 사람의 프로필 사진 주소입니다.
 * @param {string?} url - 메시지 알림 팝업을 클릭했을 때 이동할 주소입니다.
 * @return {Promise<Number>} 메시지 알림 전송에 성공한 기기의 수를 반환합니다. 오류가 발생하면 -1을 반환합니다.
 */
const sendMessageByTokens = async (tokens, title, body, icon, url) => {
  url = url || "/myroom";
  const data = { title, body, icon, url };
  return await sendNotificationByTokens(data, tokens);
};

/**
 * 주어진 topic을 구독하고 있는 모든 기기에 메시지 알림을 전송합니다.
 * @param {string} topic - 메시지 알림을 보낼 기기들이 구독하고 있는 topic입니다.
 * @param {string} title - 보낼 메시지의 제목입니다.
 * @param {string} body - 보낼 메시지의 본문입니다.
 * @param {string} icon - 메시지를 보낸 사람의 프로필 사진 주소입니다.
 * @param {string?} url - 메시지 알림 팝업을 클릭했을 때 이동할 주소입니다.
 * @return {Promise<boolean>} 메시지 알림 전송에 성공했으면 true, 아니면 false를 반환합니다.
 */
const sendMessageByTopic = async (topic, title, body, icon, url) => {
  url = url || "/myroom";
  const data = { title, body, icon, url };
  return await sendNotificationByTopic(data, topic);
};

/**
 * 주어진 사용자를 특정한 topic에 구독시킵니다.
 * @param {string} userId - topic을 구독할 사용자의 ObjectId입니다.
 * @param {string} topic - 구독할 topic입니다.
 * @return {Promise<Number>} 토픽 구독에 성공한 기기의 수를 반환합니다. 오류가 발생하면 -1을 반환합니다.
 */
const subscribeUserToTopic = async (userId, topic) => {
  try {
    const { deviceToken } = await deviceTokenModel.findOne({
      userId,
    });
    const { successCount } = await getMessaging().subscribeToTopic(
      deviceToken,
      topic
    );

    // 데이터베이스에 해당 토큰에 대한 토픽 구독 레코드를 추가합니다.
    await Promise.all(
      deviceToken.map(async (token) => {
        return await topicSubscriptionModel.updateOne(
          {
            deviceToken: token,
            topic: topic,
          },
          {
            deviceToken: token,
            topic: topic,
          },
          {
            upsert: true,
            new: true,
          }
        );
      })
    );

    logger.info(`${userId}'s ${successCount} token(s) subscribed to ${topic}`);
    return successCount;
  } catch (error) {
    logger.error(error);
    return -1;
  }
};

/**
 * 주어진 사용자를 특정한 topic으로부터 구독 해제시킵니다.
 * @param {string} userId - topic을 구독 해제할 사용자의 id입니다.
 * @param {string} topic - 구독을 해제할 topic입니다.
 * @return {Promise<Number>} 토픽 구독 해제에 성공한 기기의 수를 반환합니다. 오류가 발생하면 -1을 반환합니다.
 */
const unsubscribeUserFromTopic = async (userId, topic) => {
  try {
    const { deviceToken } = await deviceTokenModel.findOne({
      userId,
    });
    const { successCount } = await getMessaging().unsubscribeFromTopic(
      deviceToken,
      topic
    );

    // 데이터베이스에서 해당 토큰에 대한 토픽 구독 레코드를 삭제합니다.
    await Promise.all(
      deviceToken.map(async (token) => {
        return await topicSubscriptionModel.deleteOne({
          deviceToken: token,
          topic: topic,
        });
      })
    );

    logger.info(
      `${userId}'s ${successCount} token(s) unsubscribed from ${topic}`
    );
    return successCount;
  } catch (error) {
    logger.error(error);
    return -1;
  }
};

module.exports = {
  registerDeviceToken,
  unregisterDeviceToken,
  getTokensOfUsers,
  sendMessageByToken,
  sendMessageByTokens,
  sendMessageByTopic,
  subscribeUserToTopic,
  unsubscribeUserFromTopic,
};
