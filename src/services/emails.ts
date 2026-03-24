import { emailModel } from "@/modules/stores/mongo";
import logger from "@/modules/logger";
import type { RequestHandler } from "express";

export const emailTrackingHandler: RequestHandler = async (req, res) => {
  const trackingId = req.query.trackingId as string;
  try {
    await emailModel.updateOne(
      { trackingId, isOpened: { $ne: true } },
      { $set: { isOpened: true, openedAt: new Date() } }
    );

    res.set("Content-Type", "image/gif");
    return res.send(
      Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64")
    );
  } catch (err) {
    logger.error(err);
    return res.status(500).send("Emails/openTracking: Internal Server Error");
  }
};
