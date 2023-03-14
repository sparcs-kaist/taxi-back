const { notificationOptionModel } = require("../db/mongo");
const logger = require("../modules/logger");

const getNotificationOptions = async (req, res) => {
  try {
    const { deviceToken } = req.body;
    if (!deviceToken) {
      return res
        .status(400)
        .send("Notification/getNotificationOptions: deviceToken not found");
    }

    // deviceToken에 대응되는 알림 설정을 찾아 반환합니다.
    const notificationOptions = await notificationOptionModel
      .findOne(
        {
          deviceToken,
        },
        "-_id chatting keywords beforeDepart notice advertisement"
      )
      .lean();
    if (!notificationOptions) {
      return res
        .status(400)
        .send("Notificaiton/getNotificationOptions: deviceToken not found");
    }
    res.status(200).json(notificationOptions);
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .send("Notification/getNotificationOptions: internal server error");
  }
};

const changeNotificationOptions = async (req, res) => {
  try {
    const { deviceToken, options } = req.body;

    if (!deviceToken) {
      return res
        .status(400)
        .send("Notification/changeNotificationOptions: deviceToken not found");
    }

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
      newOptions.keywords = options.keyword;
    }

    const updatedNotificationOptions = await notificationOptionModel.updateOne(
      {
        deviceToken,
      },
      {
        deviceToken,
        newOptions,
      },
      {
        new: true,
      }
    );

    if (!updatedNotificationOptions)
      res
        .status(400)
        .send("Notification/changeNotificationOptions: deviceToken not found");

    res.status(200).json(updatedNotificationOptions);
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .send("Notification/changeNotificationOptions: internal server error");
  }
};

module.exports = {
  getNotificationOptions,
  changeNotificationOptions,
};