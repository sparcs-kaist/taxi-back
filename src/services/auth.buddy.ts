import { timingSafeEqual } from "crypto";
import { buddyApiKey, nodeEnv, testAccounts } from "@/loadenv";
import logger from "@/modules/logger";
import { userModel } from "@/modules/stores/mongo";
import type { RequestHandler } from "express";
import type { SparcsssoUserData } from "@/types/sparcssso";
import { joinus, transUserData, update } from "./auth";

const hasValidApiKey = (providedKey: string | undefined) => {
  if (!buddyApiKey || !providedKey) return false;

  const expected = Buffer.from(buddyApiKey);
  const provided = Buffer.from(providedKey);
  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
};

export const buddyApiKeyMiddleware: RequestHandler = (req, res, next) => {
  if (!buddyApiKey) {
    return res
      .status(503)
      .json({ error: "Buddy integration is not configured" });
  }
  if (!hasValidApiKey(req.header("X-BUDDY-API-KEY"))) {
    return res.status(401).json({ error: "unauthorized" });
  }

  return next();
};

const buddyResolveHandler: RequestHandler = async (req, res) => {
  let userData: ReturnType<typeof transUserData>;
  try {
    userData = transUserData(req.body as SparcsssoUserData);
  } catch {
    return res.status(400).json({ error: "invalid SSO user info" });
  }

  try {
    if (
      !userData.isEligible &&
      nodeEnv === "production" &&
      !testAccounts?.includes(userData.email)
    ) {
      return res.status(403).json({ error: "registration denied" });
    }

    const userQuery = { id: userData.id, withdraw: false };
    let user = await userModel.findOne(userQuery);
    if (!user) {
      if (!(await joinus(req, userData))) {
        return res.status(403).json({ error: "registration denied" });
      }
      user = await userModel.findOne(userQuery);
      if (!user) throw new Error("Created user could not be found");
    } else if (
      user.name !== userData.name ||
      user.email !== userData.email ||
      user.subinfo?.kaist !== userData.kaist
    ) {
      await update(userData);
      user = await userModel.findOne(userQuery);
      if (!user) throw new Error("Updated user could not be found");
    }

    return res.json({ oid: user.get("_id").toString() });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

export default buddyResolveHandler;
