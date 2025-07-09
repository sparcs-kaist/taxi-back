import { locationModel } from "@/modules/stores/mongo";
import logger from "@/modules/logger";
import type { RequestHandler } from "express";

export const getAllLocationsHandler: RequestHandler = async (_, res) => {
  try {
    const locations = await locationModel
      .find(
        {
          isValid: { $ne: false },
        },
        { __v: 0 }
      )
      .sort({ priority: 1 });
    const serverTime = new Date().toISOString();
    res.json({ locations, serverTime });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Locations/ : internal server error" });
  }
};
