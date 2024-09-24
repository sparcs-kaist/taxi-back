const firebaseAdmin = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");
const {
  deviceTokenModel,
  notificationOptionModel,
  topicSubscriptionModel,
} = require("./stores/mongo");
const logger = require("../modules/logger");
const { googleApplicationCredentials } = require("../../loadenv");

/**
 * credential을 등록합니다.
 */
const initializeApp = () => {
  if (googleApplicationCredentials) {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(googleApplicationCredentials),
    });
  } else {
    logger.error(
      "There is no credential for Firebase. FCM functions are disabled."
    );
  }
};

/**
 * 사용자의 ObjectId와 FCM device token이 주어졌을 때, 해당 deviceToken을 사용자의 토큰으로 DB에 등록합니다.
 * @param {string} userId - 사용자의 ObjectId입니다.
 * @param {string} deviceToken - 등록하려는 FCM device token입니다.
 * @return {Promise<Array<string>>} 변경된 사용자의 deviceToken의 목록 Array를 반환합니다. 오류가 발생하면 빈 배열을 반환합니다.
 */
const registerDeviceToken = async (userId, deviceToken) => {
  try {
    // 디바이스 토큰을 다른 사용자가 사용하고 있는지 확인 및 삭제합니다.
    await deviceTokenModel.updateMany(
      { userId: { $ne: userId }, deviceTokens: deviceToken },
      { $pull: { deviceTokens: deviceToken } }
    );

    // 디바이스 토큰을 DB에 추가합니다.
    const newDeviceToken = await deviceTokenModel.findOneAndUpdate(
      { userId },
      {
        userId,
        $addToSet: { deviceTokens: deviceToken },
      },
      { upsert: true, new: true }
    );

    // 디바이스 토큰 관련 설정을 DB에 추가합니다.
    await notificationOptionModel.updateOne(
      { deviceToken },
      { deviceToken },
      { upsert: true }
    );

    return newDeviceToken.deviceTokens;
  } catch (error) {
    logger.error(error);
    return new Array();
  }
};

// TODO: remove userId
/**
 * 사용자의 ObjectId와 FCM device token이 주어졌을 때, 해당 사용자의 해당 deviceToken을 DB에서 삭제합니다.
 * @param {string} userId - 사용자의 ObjectId입니다.
 * @param {string} deviceToken - 삭제하려는 FCM device token입니다.
 * @return {Promise<boolean>} 해당 deviceToken을 가진 모든 사용자로부터 해당 deviceToken을 삭제하는 데 성공하면 true, 하나 이상의 사용자에게서 해당 deviceToken을 삭제하는 데 실패하면 false를 반환합니다. 삭제할 deviceToken이 존재하지 않는 경우에는 true를 반환합니다.
 */
const unregisterDeviceToken = async (deviceToken) => {
  try {
    // 디바이스 토큰을 DB에서 삭제합니다.
    const { matchedCount, modifiedCount } = await deviceTokenModel.updateMany(
      { deviceTokens: deviceToken },
      {
        $pull: { deviceTokens: deviceToken },
      },
      { upsert: true, new: true }
    );

    // 디바이스 토큰 관련 설정을 DB에서 삭제합니다.
    await notificationOptionModel.deleteOne({
      deviceToken,
    });

    return matchedCount === modifiedCount;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

/**
 * 메시지 전송에 실패한 deviceToken을 DB에서 삭제합니다.
 * @param {Array<string>} deviceTokens - 사용자의 ObjectId입니다.
 * @param {Array<SendResponse>} fcmResponses - 등록하려는 FCM device token입니다.
 * @return {Promise<Array<Boolean>>} 각각의 토큰들의 삭제 성공 여부가 저장된 Array를 반환합니다. 해당 토큰을 DB에서 삭제하는 데 성공했으면 true, 아니면 false가 포함됩니다.
 */
const removeExpiredTokens = async (deviceTokens, fcmResponses) => {
  const removalResults = await Promise.all(
    deviceTokens.map(async (deviceToken, index) => {
      try {
        // FCM device token이 유효하지 않아 메시지 전송에 실패한 경우, 해당 device token을 DB에서 삭제합니다.
        if (
          fcmResponses[index].error.code ===
          "messaging/registration-token-not-registered"
        ) {
          await unregisterDeviceToken(deviceToken);
          return true;
        }
        return false;
      } catch (err) {
        logger.error(err);
        return false;
      }
    })
  );
  const removedTokenCount = removalResults.filter((result) => result).length;
  logger.info(
    `${removedTokenCount} deviceTokens were removed from the database.`
  );
  return removalResults;
};

/**
 * 사용자의 FCM device token이 현재 사용 가능한지 검증합니다.
 * @summary 해당 디바이스에 dry-run 방식으로 메시지 전송을 시험함으로써 해당 deviceToken이 사용 가능한지 검증합니다. dry-run 시 FCM 서버에는 메시지 전송 요청이 전송되지만, 실제 기기에는 알림이 전송되지 않습니다.
 * @param {string} deviceToken - 사용 가능 여부를 확인하려고 하는 FCM device token입니다.
 * @return {Promise<Boolean>} 해당 디바이스에 알림을 보낸다는 요청을 FCM 서버에 성공적으로 보냈으면 true, 아니면 false를 반환합니다.
 */
const validateDeviceToken = async (deviceToken) => {
  try {
    const message = {
      token: deviceToken,
      data: {
        dryRun: "true",
      },
    };
    await getMessaging().send(message, true);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

/**
 * 사용자들의 ObjectId의 배열이 주어졌을 때, 해당 사용자들의 모든 deviceToken을 하나의 Array로 반환합니다.
 * @param {Array<string>} userIds - 사용자의 ObjectId로 이루어진 Array입니다.
 * @param {Object?} notificationOptions - 특정 알림 설정을 비활성화한 사용자를 필터링하기 위해 사용되는 Object입니다.
 * @param {Boolean?} notificationOptions.chatting - true 또는 false로 주어진 경우, 채팅 알림 설정이 각각 true 또는 false로 설정된 사용자들의 deviceToken만 반환합니다.
 * @return {Promise<Array<string>>} deviceToken의 Array를 반환합니다. 오류가 발생하면 빈 배열을 반환합니다.
 */
const getTokensOfUsers = async (userIds, notificationOptions = {}) => {
  const deviceTokensOfUsers = (
    await Promise.all(
      userIds.map(
        async (userId) =>
          (await deviceTokenModel.findOne({ userId }))?.deviceTokens || []
      )
    )
  ).flat();
  const deviceTokensWithOptions = (
    await Promise.all(
      deviceTokensOfUsers.map(async (deviceToken) =>
        (await notificationOptionModel.findOne({
          deviceToken,
          ...notificationOptions,
        }))
          ? [deviceToken]
          : []
      )
    )
  ).flat();
  return deviceTokensWithOptions;
};

/**
 * 주어진 token들에 메시지 알림을 전송합니다.
 * TODO: 알림 전송 실패한 토큰 삭제하기
 * @param {Array<string>} tokens - 메시지 알림을 받을 기기의 deviceToken들로 구성된 Array입니다.
 * @param {string} type - 메시지 유형으로, "text" | "in" | "out" | "s3img" | "payment" | "settlement" 입니다.
 * @param {string} title - 보낼 메시지의 제목입니다.
 * @param {string} body - 보낼 메시지의 본문입니다.
 * @param {string?} icon - 메시지를 보낸 사람의 프로필 사진 주소입니다.
 * @param {string?} link - 메시지 알림 팝업을 클릭했을 때 이동할 주소입니다.
 * @return {Promise<Number>} 메시지 알림 전송에 실패한 기기의 수를 반환합니다. 오류가 발생하면 -1을 반환합니다.
 */
const sendMessageByTokens = async (tokens, type, title, body, icon, link) => {
  if (tokens.length === 0) return -1;
  try {
    const message = {
      tokens,
      data: {
        title,
        body,
        url: link || "/",
        icon: icon || "https://taxi.sparcs.org/icons-512.png",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      apns: { payload: { aps: { alert: { title, body } } } },
      android: {
        ttl: 0,
      },
    };
    const { responses, failureCount } =
      await getMessaging().sendEachForMulticast(message);

    // 메시지 전송에 실패한 기기가 존재할 경우, 해당 기기의 deviceToken을 DB에서 삭제합니다.
    if (failureCount) {
      logger.info(`Notification sent failed for ${failureCount} devices`);
      await removeExpiredTokens(tokens, responses);
    }

    return failureCount;
  } catch (error) {
    logger.error(error);
    return -1;
  }
};

/**
 * 주어진 topic을 구독하고 있는 모든 기기에 메시지 알림을 전송합니다.
 * @param {string} topic - 메시지 알림을 보낼 기기들이 구독하고 있는 topic입니다.
 * @param {string} type - 메시지 유형으로, "text" | "in" | "out" | "s3img" | "payment" | "settlement" 입니다.
 * @param {string} title - 보낼 메시지의 제목입니다.
 * @param {string} body - 보낼 메시지의 본문입니다.
 * @param {string?} icon - 메시지를 보낸 사람의 프로필 사진 주소입니다.
 * @param {string?} link - 메시지 알림 팝업을 클릭했을 때 이동할 주소입니다.
 * @return {Promise<boolean>} 메시지 알림 전송에 성공했으면 true, 아니면 false를 반환합니다.
 */
const sendMessageByTopic = async (topic, type, title, body, icon, link) => {
  try {
    const message = {
      topic,
      data: {
        title,
        body,
        url: link || "/",
        icon: icon || "/icons-512.png",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        ttl: 0,
      },
    };
    await getMessaging().send(message);
    logger.info(`Notification sent to token ${topic}`);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

/**
 * 주어진 사용자를 특정한 topic에 구독시킵니다.
 * @param {string} userId - topic을 구독할 사용자의 ObjectId입니다.
 * @param {string} topic - 구독할 topic입니다.
 * @return {Promise<Number>} 토픽 구독에 실패한 기기의 수를 반환합니다. 오류가 발생하면 -1을 반환합니다.
 */
const subscribeUserToTopic = async (userId, topic) => {
  try {
    const deviceToken = await deviceTokenModel.findOne({
      userId,
    });
    // deviceToken이 존재하지 않는 경우, -1을 반환합니다.
    if (!deviceToken?.deviceTokens || deviceToken.deviceTokens.length === 0) {
      return -1;
    }

    const { failureCount } = await getMessaging().subscribeToTopic(
      deviceToken.deviceTokens,
      topic
    );

    // 데이터베이스에 해당 토큰에 대한 토픽 구독 레코드를 추가합니다.
    await Promise.all(
      deviceToken.deviceTokens.map(async (token) => {
        return await topicSubscriptionModel.findOneAndUpdate(
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

    logger.info(
      `${userId}'s ${failureCount} token(s) were not subscribed to ${topic}`
    );
    return failureCount;
  } catch (error) {
    logger.error(error);
    return -1;
  }
};

/**
 * 주어진 사용자를 특정한 topic으로부터 구독 해제시킵니다.
 * @param {string} userId - topic을 구독 해제할 사용자의 id입니다.
 * @param {string} topic - 구독을 해제할 topic입니다.
 * @return {Promise<Number>} 토픽 구독 해제에 실패한 기기의 수를 반환합니다. 오류가 발생하면 -1을 반환합니다.
 */
const unsubscribeUserFromTopic = async (userId, topic) => {
  try {
    const deviceToken = await deviceTokenModel.findOne({
      userId,
    });
    // deviceToken이 존재하지 않는 경우, -1을 반환합니다.
    if (!deviceToken?.deviceTokens || deviceToken.deviceTokens.length === 0) {
      return -1;
    }

    const { failureCount } = await getMessaging().unsubscribeFromTopic(
      deviceToken.deviceTokens,
      topic
    );

    // 데이터베이스에서 해당 토큰에 대한 토픽 구독 레코드를 삭제합니다.
    await Promise.all(
      deviceToken.deviceTokens.map(async (token) => {
        return await topicSubscriptionModel.deleteOne({
          deviceToken: token,
          topic: topic,
        });
      })
    );

    logger.info(
      `${userId}'s ${failureCount} token(s) were not unsubscribed from ${topic}`
    );
    return failureCount;
  } catch (error) {
    logger.error(error);
    return -1;
  }
};

module.exports = {
  initializeApp,
  registerDeviceToken,
  unregisterDeviceToken,
  validateDeviceToken,
  getTokensOfUsers,
  sendMessageByTokens,
  sendMessageByTopic,
  subscribeUserToTopic,
  unsubscribeUserFromTopic,
};
