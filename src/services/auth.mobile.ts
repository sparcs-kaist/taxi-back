import { Request, Response } from "express";

import { userModel } from "@/modules/stores/mongo";
import { login } from "@/modules/auths/login";

import { registerDeviceToken, unregisterDeviceToken } from "@/modules/fcm";

import * as jwt from "@/modules/auths/jwt";
import logger from "@/modules/logger";

import { jwt as jwtValue } from "@/loadenv";
import { JwtPayload } from "jsonwebtoken";
const { TOKEN_EXPIRED, TOKEN_INVALID } = jwtValue;

const tokenLoginHandler = async (req: Request, res: Response) => {
  const { accessToken, deviceToken } = req.query as {
    accessToken: string;
    deviceToken: string;
  };
  // const accessToken = req.query.accessToken as string;
  // const { deviceToken } = req.query;
  try {
    if (!accessToken || !deviceToken) {
      return res.status(400).send("invalid request");
    }

    const data = (await jwt.verify(accessToken)) as JwtPayload | number;
    if (typeof data === "number") {
      if (data === TOKEN_INVALID) {
        return res.status(401).json({ message: "Invalid token" });
      } else if (data === TOKEN_EXPIRED) {
        return res.status(401).json({ message: "Expired token" });
      } else {
        // 정상 작동시 accessTokenStatus는 TOKEN_EXPIRED, TOKEN_INVALID이거나 / JwtPayload임
        return res.status(401).json({ message: "Invalid output" });
      }
    }

    if (typeof data !== "number" && data.type !== "access") {
      return res.status(401).json({ message: "Not Access token" });
    }

    const user = await userModel.findOne({ _id: data.id, withdraw: false });
    if (!user) {
      return res.status(401).json({ message: "No corresponding user" });
    }

    // What the fuck?
    // Problem: sid does not exist at ../modules/stores/mongo.ts (userSchema) (or mongo.d.ts)
    // Is sid not used?
    // Origin: login(req, user.sid, user.id, user._id.toString(), user.name);
    login(req, "", user.id, user._id.toString(), user.name);
    req.session.isApp = true;
    req.session.deviceToken = deviceToken;

    return res.status(200).json({ message: "success" });
  } catch (e) {
    logger.error(e);
    return res.status(500).send("server error");
  }
};

const tokenRefreshHandler = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = req.query as {
      accessToken: string;
      refreshToken: string;
    };
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
    if (typeof data === "string" || typeof data === "number") {
      return res.status(401).json({ message: "Not Refresh token" });
    } else if (data.type !== "refresh") {
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

const registerDeviceTokenHandler = async (req: Request, res: Response) => {
  try {
    const { accessToken, deviceToken } = req.body;
    const accessTokenStatus = (await jwt.verify(accessToken)) as
      | JwtPayload
      | number;
    if (!deviceToken) {
      return res.status(400).send("invalid request");
    }
    if (typeof accessTokenStatus === "number") {
      if (
        accessTokenStatus === TOKEN_EXPIRED ||
        accessTokenStatus === TOKEN_INVALID
      ) {
        return res.status(401).send("unauthorized");
      } else {
        // 정상 작동시 accessTokenStatus는 TOKEN_EXPIRED, TOKEN_INVALID이거나 / JwtPayload임
        return res.status(401).send("invalid output");
      }
    }

    await registerDeviceToken(accessTokenStatus.id, deviceToken);
    res.status(200).send("success");
  } catch (e) {
    logger.error(e);
    res.status(500).send("server error");
  }
};

const removeDeviceTokenHandler = async (req: Request, res: Response) => {
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

export {
  tokenLoginHandler,
  tokenRefreshHandler,
  registerDeviceTokenHandler,
  removeDeviceTokenHandler,
};
