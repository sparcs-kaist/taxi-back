const { getMessaging } = require("firebase-admin/messaging");
const { deviceTokenModel, topicSubscriptionModel } = require("../db/mongo");
const logger = require("../modules/logger");

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

const sendNotificationByTokens = async (data, tokens) => {
  try {
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
 * @param {string} token - 알림을 받을 기기의 deviceToken입니다.
 * @param {string} title - 보낼 메시지의 제목입니다.
 * @param {string} body - 보낼 메시지의 본문입니다.
 * @param {string} icon - 메시지를 보낸 사람의 프로필 사진 주소입니다.
 * @param {string?} url - 알림 팝업을 클릭했을 때 이동할 주소입니다.
 * @return {Promise<boolean>} 알림 전송에 성공했으면 true, 아니면 false를 반환합니다.
 */
const sendMessageByToken = async (token, title, body, icon, url) => {
  url = url || "/myroom";
  const data = { title, body, icon, url };
  return await sendNotificationByToken(data, token);
};

/**
 * 주어진 token들에 메시지 알림을 전송합니다.
 * @param {string} tokens - 알림을 받을 기기의 deviceToken들로 구성된 Array입니다.
 * @param {string} title - 보낼 메시지의 제목입니다.
 * @param {string} body - 보낼 메시지의 본문입니다.
 * @param {string} icon - 메시지를 보낸 사람의 프로필 사진 주소입니다.
 * @param {string?} url - 알림 팝업을 클릭했을 때 이동할 주소입니다.
 * @return {Promise<Number>} 알림 전송에 성공한 기기의 수를 반환합니다. 오류가 발생하면 -1을 반환합니다.
 */
const sendMessageByTokens = async (tokens, title, body, icon, url) => {
  url = url || "/myroom";
  const data = { title, body, icon, url };
  return await sendNotificationByTokens(data, tokens);
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
 * 주어진 사용자를 주어진 roomId들에 해당하는 topic들에 구독시킵니다.
 * @summary subscribeUserToTopic의 기능을 연장한 함수입니다.
 * @param {string} userId - topic을 구독할 사용자의 ObjectId입니다.
 * @param {Array<string>} roomIds: 구독할 room의 ObjectId들로 구성된 Array입니다.
 * @return {Promise<Number>} 토픽 구독에 성공한 기기의 수를 반환합니다. 오류가 발생하면 -1을 반환합니다.
 */
const subscribeUserToRoomTopics = async (userId, roomIds) => {
  try {
    const result = await Promise.all(
      roomIds.map(async (roomId) => {
        const topic = `room-${roomId}`;
        return await subscribeUserToTopic(userId, topic);
      })
    );
    if (result.includes(-1)) {
      return -1;
    } else {
      return result.reduce((a, b) => a + b, 0);
    }
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

/**
 * 주어진 topic을 구독하고 있는 모든 기기에 메시지 알림을 전송합니다.
 * @param {string} topic - 알림을 보낼 기기들이 구독하고 있는 topic입니다.
 * @param {string} title - 보낼 메시지의 제목입니다.
 * @param {string} body - 보낼 메시지의 본문입니다.
 * @param {string} icon - 메시지를 보낸 사람의 프로필 사진 주소입니다.
 * @param {string?} url - 알림 팝업을 클릭했을 때 이동할 주소입니다.
 * @return {Promise<boolean>} 알림 전송에 성공했으면 true, 아니면 false를 반환합니다.
 */
const sendMessageByTopic = async (topic, title, body, icon, url) => {
  url = url || "/myroom";
  const data = { title, body, icon, url };
  return await sendNotificationByTopic(data, topic);
};

module.exports = {
  sendMessageByToken,
  sendMessageByTokens,
  subscribeUserToTopic,
  subscribeUserToRoomTopics,
  unsubscribeUserFromTopic,
  sendMessageByTopic,
};
