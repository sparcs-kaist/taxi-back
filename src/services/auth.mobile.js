const { userModel } = require("@/modules/stores/mongo");
const { login } = require("@/modules/auths/login");

const { registerDeviceToken, unregisterDeviceToken } = require("@/modules/fcm");
const jwt = require("@/modules/auths/jwt");
const logger = require("@/modules/logger").default;

const { TOKEN_EXPIRED, TOKEN_INVALID } = require("@/loadenv").jwt;

const tokenLoginHandler = async (req, res) => {
  const { accessToken, deviceToken } = req.query;
  try {
    if (!accessToken || !deviceToken) {
      return res.status(400).send("invalid request");
    }

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

    const user = await userModel.findOne({ _id: data.id, withdraw: false });
    if (!user) {
      return res.status(401).json({ message: "No corresponding user" });
    }

    login(req, user.sid, user.id, user._id, user.name);
    req.session.isApp = true;
    req.session.deviceToken = deviceToken;

    return res.status(200).json({ message: "success" });
  } catch (e) {
    logger.error(e);
    return res.status(500).send("server error");
  }
};

const tokenRefreshHandler = async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.query;
    if (!accessToken || !refreshToken) {
      return res.status(400).send("invalid request");
    }

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

    const { token: newAccessToken } = await jwt.sign({
      id: data.id,
      type: "access",
    });
    const { token: newRefreshToken } = await jwt.sign({
      id: data.id,
      type: "refresh",
    });
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
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
    if (!deviceToken) {
      return res.status(400).send("invalid request");
    }
    if (
      accessTokenStatus === TOKEN_EXPIRED ||
      accessTokenStatus === TOKEN_INVALID
    ) {
      return res.status(401).send("unauthorized");
    }

    await registerDeviceToken(accessTokenStatus.id, deviceToken);
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
    if (!deviceToken) {
      return res.status(400).send("invalid request");
    }
    if (
      accessTokenStatus === TOKEN_EXPIRED ||
      accessTokenStatus === TOKEN_INVALID
    ) {
      return res.status(401).send("unauthorized");
    }

    await unregisterDeviceToken(deviceToken);
    res.status(200).send("success");
  } catch (e) {
    logger.error(e);
    res.status(500).send("server error");
  }
};

module.exports = {
  tokenLoginHandler,
  tokenRefreshHandler,
  registerDeviceTokenHandler,
  removeDeviceTokenHandler,
};
