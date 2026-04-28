import { eventConfig } from "@/loadenv";
import type { RequestHandler } from "express";
import type { EventPeriod } from "../types";

const eventPeriod: EventPeriod | null = eventConfig
  ? {
      startAt: new Date(eventConfig.period.startAt),
      endAt: new Date(eventConfig.period.endAt),
    }
  : null;

export const timestampValidator: RequestHandler = (req, res, next) => {
  if (!req.timestamp) {
    return res.status(400).json({ error: "timestamp is missing" });
  }

  if (!eventPeriod) {
    return res
      .status(400)
      .json({ error: "Event period is not properly defined" });
  }

  if (
    req.timestamp >= eventPeriod.endAt.getTime() ||
    req.timestamp < eventPeriod.startAt.getTime()
  ) {
    return res.status(400).json({ error: "Out of date" });
  }

  next();
};
