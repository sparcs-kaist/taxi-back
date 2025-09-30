const { userModel } = require("@/modules/stores/mongo");
const { notificationOptionModel } = require("@/modules/stores/mongo");
const logger = require("@/modules/logger").default;

const { registerDeviceToken, validateDeviceToken } = require("@/modules/fcm");

// 이벤트 코드입니다.
import { contracts } from "@/lottery";

const registerDeviceTokenHandler = async (req, res) => {
  try {
    // 해당 FCM device token이 유효한지 검사합니다.
    const { deviceToken } = req.body;
    const isValid = await validateDeviceToken(deviceToken);
    if (!isValid) {
      return res
        .status(400)
        .send("Notifications/registerDeviceToken : deviceToken is invalid");
    }

    // 데이터베이스에 deviceToken 레코드를 추가합니다.
    const user = await userModel.findOne(
      { _id: req.userOid, withdraw: false },
      "_id"
    );
    const newDeviceToken = await registerDeviceToken(user._id, deviceToken);

    // 세션에 현재 사용자 기기의 deviceToken을 저장합니다.
    req.session.deviceToken = deviceToken;

    return res.status(200).json({
      deviceToken: newDeviceToken,
    });
  } catch (e) {
    logger.error(e);
    res
      .status(500)
      .send("Notifications/registerDeviceToken : internal server error");
  }
};

const optionsHandler = async (req, res) => {
  try {
    // 세션에 deviceToken이 저장되어 있는지 검사합니다.
    const { deviceToken } = req.session;
    if (!deviceToken) {
      return res
        .status(400)
        .send("Notifications/options : deviceToken not found");
    }

    // deviceToken에 대응되는 알림 설정을 찾아 반환합니다.
    const notificationOptions = await notificationOptionModel
      .findOne(
        { deviceToken },
        "-_id chatting keywords beforeDepart notice advertisement"
      )
      .lean();
    if (!notificationOptions) {
      return res
        .status(400)
        .send("Notificaiton/options: notificationOption not found");
    }

    res.status(200).json(notificationOptions);
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .send("Notification/getNotificationOptions: internal server error");
  }
};

const editOptionsHandler = async (req, res) => {
  try {
    const { options } = req.body;

    // 세션에 deviceToken이 저장되어 있는지 검사합니다.
    const { deviceToken } = req.session;
    if (!deviceToken) {
      return res
        .status(400)
        .send("Notifications/options : deviceToken not found");
    }

    // FIXME : can refactor with using reduce
    const newOptions = {};
    const booleanFields = [
      "chatting",
      "beforeDepart",
      "notice",
      "advertisement",
    ];
    booleanFields.map((field) => {
      if (options[field] === true || options[field] === false) {
        newOptions[field] = options[field];
      }
    });
    if (options.keywords) {
      newOptions.keywords = options.keywords;
    }

    const updatedNotificationOptions = await notificationOptionModel
      .findOneAndUpdate({ deviceToken }, newOptions, { new: true })
      .lean();

    if (!updatedNotificationOptions) {
      return res
        .status(400)
        .send("Notification/editOptions: deviceToken not found");
    }

    // 이벤트 코드입니다.
    /*
    await contracts?.completeAdPushAgreementQuest(
      req.userOid,
      req.timestamp,
      options.advertisement
    );
    */

    res.status(200).json(updatedNotificationOptions);
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .send("Notification/editOptions: internal server error");
  }
};

module.exports = {
  registerDeviceTokenHandler,
  optionsHandler,
  editOptionsHandler,
};
