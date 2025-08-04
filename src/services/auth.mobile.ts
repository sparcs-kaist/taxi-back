import { jwt as jwtValue } from "@/loadenv";
import * as jwt from "@/modules/auths/jwt";
import { login } from "@/modules/auths/login";
import { registerDeviceToken, unregisterDeviceToken } from "@/modules/fcm";
import logger from "@/modules/logger";
import { userModel } from "@/modules/stores/mongo";

import type { RequestHandler } from "express";
import type {
  TokenLoginQuery,
  TokenRefreshQuery,
  RegisterDeviceTokenBody,
  RemoveDeviceTokenBody,
} from "@/routes/docs/schemas/authSchema";

const { TOKEN_EXPIRED, TOKEN_INVALID } = jwtValue;

export const tokenLoginHandler: RequestHandler = async (req, res) => {
  const { accessToken, deviceToken } = req.query as TokenLoginQuery;

  try {
    const data = jwt.verify(accessToken);
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

    login(req, user.id, user._id.toString());
    req.session.isApp = true;
    req.session.deviceToken = deviceToken;

    return res.status(200).json({ message: "success" });
  } catch (e) {
    logger.error(e);
    return res.status(500).send("server error");
  }
};

export const tokenRefreshHandler: RequestHandler = async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.query as TokenRefreshQuery;
    const data = jwt.verify(refreshToken);
    const accessTokenStatus = jwt.verify(accessToken);

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

    const { token: newAccessToken } = jwt.sign({
      id: data.id,
      type: "access",
    });
    const { token: newRefreshToken } = jwt.sign({
      id: data.id,
      type: "refresh",
    });
    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (e) {
    logger.error(e);
    return res.status(500).send("server error");
  }
};

export const registerDeviceTokenHandler: RequestHandler = async (req, res) => {
  try {
    const { accessToken, deviceToken } = req.body as RegisterDeviceTokenBody;
    const accessTokenStatus = jwt.verify(accessToken);
    if (
      accessTokenStatus === TOKEN_EXPIRED ||
      accessTokenStatus === TOKEN_INVALID
    ) {
      return res.status(401).send("unauthorized");
    }

    await registerDeviceToken(accessTokenStatus.id, deviceToken);
    return res.status(200).send("success");
  } catch (e) {
    logger.error(e);
    return res.status(500).send("server error");
  }
};

export const removeDeviceTokenHandler: RequestHandler = async (req, res) => {
  try {
    const { accessToken, deviceToken } = req.body as RemoveDeviceTokenBody;
    const accessTokenStatus = jwt.verify(accessToken);

    if (
      accessTokenStatus === TOKEN_EXPIRED ||
      accessTokenStatus === TOKEN_INVALID
    ) {
      return res.status(401).send("unauthorized");
    }

    await unregisterDeviceToken(deviceToken);
    return res.status(200).send("success");
  } catch (e) {
    logger.error(e);
    return res.status(500).send("server error");
  }
};
