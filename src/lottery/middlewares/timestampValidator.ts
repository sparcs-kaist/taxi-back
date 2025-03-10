import { eventConfig } from "@/loadenv";
import { Request, Response, NextFunction } from "express";
import { EventPeriod } from "../types";

const eventPeriod: EventPeriod | null = eventConfig && {
  startAt: new Date(eventConfig.period.startAt),
  endAt: new Date(eventConfig.period.endAt),
};

const timestampValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.timestamp == undefined || req.timestamp == null) {
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

export default timestampValidator;
