const { notificationOptionModel } = require("../modules/stores/mongo");
const logger = require("../modules/logger");

const optionsHandler = async (req, res) => {
  try {
    const { deviceToken } = req.query;

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

const editOptionsHandler = async (req, res) => {
  try {
    const { deviceToken, options } = req.body;

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

    await notificationOptionModel.updateOne(
      {
        deviceToken,
      },
      {
        deviceToken,
        ...newOptions,
      },
      {
        new: true,
      }
    );

    const updatedNotificationOptions = await notificationOptionModel
      .findOne(
        {
          deviceToken,
        },
        "-_id chatting keywords beforeDepart notice advertisement"
      )
      .lean();

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
  optionsHandler,
  editOptionsHandler,
};
