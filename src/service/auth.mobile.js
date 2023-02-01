const { userModel } = require("../db/mongo");
const { deviceTokenModel, notificationOptionModel } = require("../db/mongo");
const { login } = require("../auth/login");

const jwt = require("../modules/jwt");

const { TOKEN_EXPIRED, TOKEN_INVALID } = require("../config/constants");
const logger = require("../modules/logger");

const loginWithToken = async (req, res) => {
  req.session.isApp = true;
  const { accessToken, deviceToken } = req.query;
  try {
    if (!accessToken || !deviceToken)
      return res.status(400).send("invalid request");
    const data = await jwt.verify(accessToken);

    if (data === TOKEN_INVALID) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (data === TOKEN_EXPIRED) {
      return res.status(401).json({ message: "Expired token" });
    }

    if (data.type !== "access") {
      return res.status(401).json({ message: "Not Access token" });
    }

    const userInfo = await userModel.findOne({ _id: data.id });

    if (!userInfo)
      return res.status(401).json({ message: "No corresponding user" });
    else {
      login(req, userInfo.sid, userInfo.id, userInfo.name);
      req.session.deviceToken = deviceToken;
      return res.status(200).json({ message: "success" });
    }
  } catch (e) {
    logger.error(e);
    return res.status(500).send("server error");
  }
};

const refreshAccessToken = async (req, res) => {
  const { accessToken, refreshToken } = req.query;
  if (!accessToken || !refreshToken)
    return res.status(400).send("invalid request");

  try {
    const data = await jwt.verify(refreshToken);

    const accessTokenStatus = await jwt.verify(accessToken);

    if (accessTokenStatus === TOKEN_INVALID) {
      return res.status(401).json({ message: "Invalid access token" });
    }

    if (data === TOKEN_INVALID) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (data === TOKEN_EXPIRED) {
      return res.status(401).json({ message: "Expired token" });
    }

    if (data.type !== "refresh") {
      return res.status(401).json({ message: "Not Refresh token" });
    }

    const newAccessToken = await jwt.sign({ id: data.id, type: "access" });
    const newRefreshToken = await jwt.sign({ id: data.id, type: "refresh" });
    return res.json({
      accessToken: newAccessToken.token,
      refreshToken: newRefreshToken.token,
    });
  } catch (e) {
    logger.error(e);
    res.status(501).send("server error");
  }
};

const registerDeviceTokenHandler = async (req, res) => {
  try {
    const { accessToken, deviceToken } = req.body;

    const accessTokenStatus = await jwt.verify(accessToken);

    if (!deviceToken) return res.status(400).send("invalid request");
    if (
      accessTokenStatus === TOKEN_EXPIRED ||
      accessTokenStatus === TOKEN_INVALID
    )
      return res.status(401).send("unauthorized");

    await deviceTokenModel.updateOne(
      {
        userid: accessTokenStatus.id,
      },
      {
        userid: accessTokenStatus.id,
        $addToSet: { deviceToken: deviceToken },
      },
      { upsert: true, new: true }
    );

    notificationOptionModel.findOne(
      {
        deviceToken: deviceToken,
        owner: accessTokenStatus.id,
      },
      async (err, result) => {
        if (err) {
          logger.error(err);
        }
        if (!result) {
          try {
            await notificationOptionModel.create({
              deviceToken: deviceToken,
              owner: accessTokenStatus.id,
            });
          } catch (err) {
            logger.error(err);
          }
        }
      }
    );

    res.status(200).send("success");
  } catch (e) {
    logger.error(e);
    res.status(500).send("server error");
  }
};

const removeDeviceTokenHandler = async (req, res) => {
  try {
    const { accessToken, deviceToken } = req.body;

    const accessTokenStatus = await jwt.verify(accessToken);

    if (!deviceToken) return res.status(400).send("invalid request");

    if (
      accessTokenStatus === TOKEN_EXPIRED ||
      accessTokenStatus === TOKEN_INVALID
    )
      return res.status(401).send("unauthorized");

    await deviceTokenModel.updateOne(
      {
        userid: accessTokenStatus.id,
      },
      { userid: accessTokenStatus.id, $pull: { deviceToken: deviceToken } },
      { upsert: true, new: true }
    );

    res.status(200).send("success");
  } catch (e) {
    logger.error(e);
    res.status(500).send("server error");
  }
};

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
      logger.error(e);
    }
  } catch (e) {
    logger.error(e);
    res.status(500).send("server error");
  }
};

module.exports = {
  loginWithToken,
  refreshAccessToken,
  registerDeviceTokenHandler,
  removeDeviceTokenHandler,
  changeNotificationOption,
  getNotificationOption,
};
