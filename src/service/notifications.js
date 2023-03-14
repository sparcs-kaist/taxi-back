const { deviceTokenModel } = require("../db/mongo");

const changeNotificationOptions = async (req, res) => {
  res.status(400).send("Bad request");
};

const getNotificationOptions = async (req, res) => {
  res.status(400).send("Bad request");
};

/*
const changeNotificationOption = async (req, res) => {
  try {
    const { accessToken, deviceToken, options } = req.body;

    const accessTokenStatus = await jwt.verify(accessToken);

    if (!deviceToken) return res.status(400).send("invalid request");

    if (!options) return res.status(400).send("invalid request");

    if (
      accessTokenStatus === TOKEN_EXPIRED ||
      accessTokenStatus === TOKEN_INVALID
    )
      return res.status(401).send("unauthorized");

    notificationOptionModel.updateOne(
      {
        owner: accessTokenStatus.id,
        deviceToken: deviceToken,
      },
      { options: options },
      (err, docs) => {
        if (err) {
          logger.error(err);
          res.status(500).send("DB Error");
        }
        if (docs.matchedCount == 0) {
          res.status(404).send("DeviceToken not found");
        } else {
          res.status(200).send("success");
        }
      }
    );
  } catch (e) {
    logger.error(e);
    res.status(500).send("server error");
  }
};

const getNotificationOption = async (req, res) => {
  try {
    const { accessToken, deviceToken } = req.body;

    const accessTokenStatus = await jwt.verify(accessToken);

    if (!deviceToken) return res.status(400).send("invalid request");

    if (
      accessTokenStatus === TOKEN_EXPIRED ||
      accessTokenStatus === TOKEN_INVALID
    )
      return res.status(401).send("unauthorized");
    try {
      notificationOptionModel.findOne(
        {
          owner: accessTokenStatus.id,
          deviceToken: deviceToken,
        },
        (err, result) => {
          try {
            if (err) {
              res.status(500).send("db error");
            }
            if (result) {
              res.json(result.options);
            } else {
              res.status(404).send("deviceToken isn't in DB");
            }
          } catch (e) {
            logger.error(e);
            res.status(500).send("DB Error");
          }
        }
      );
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    logger.error(e);
    res.status(500).send("server error");
  }
};
*/

module.exports = {
  getNotificationOptions,
  changeNotificationOptions,
};
