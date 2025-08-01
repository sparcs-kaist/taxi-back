import { emailModel } from "@/modules/stores/mongo";
import logger from "@/modules/logger";
import type { RequestHandler } from "express";

export const emailHandler: RequestHandler = async (req, res) => {
  const trackingId = req.query.trackingId as string;

  if (!trackingId) {
    return res.status(400).send("Email/open-tracking: Tracking ID missing");
  }

  try {
    const trackingRecord = await emailModel.findOne({ trackingId });
    if (!trackingRecord) {
      return res.status(404).send("Email/open-tracking: Tracking ID not found");
    }

    trackingRecord.isOpened = true;
    trackingRecord.openedAt = new Date();
    await trackingRecord.save();

    res.set("Content-Type", "image/gif");
    return res.send(
      Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64")
    );
  } catch (err) {
    logger.error(err);
    return res.status(500).send("Email/open-tracking: Internal Server Error");
  }
};
