import type { RequestHandler } from "express";
import * as jwt from "@/modules/auths/jwt";
import { userModel } from "@/modules/stores/mongo";
import { getBearerToken } from "@/modules/auths/login";

const buddyTokenMiddleware: RequestHandler = async (req, res, next) => {
  if (req.path === "/admin" || req.path.startsWith("/admin/")) {
    return next();
  }

  const token = getBearerToken(req);
  if (!token) return next();

  const payload = jwt.verifyBuddyToken(token);
  if (!payload) return next();

  try {
    const user = await userModel.findOne(
      { id: payload.uid, withdraw: false },
      "_id"
    );
    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    req.buddyLoginInfo = {
      id: payload.uid,
      oid: user.get("_id").toString(),
    };
    return next();
  } catch (error) {
    return next(error);
  }
};

export default buddyTokenMiddleware;
