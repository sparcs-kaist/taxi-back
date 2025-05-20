import { eventStatusModel } from "../modules/stores/mongo";
import logger from "@/modules/logger";
import type { RequestHandler } from "express";
import type { EventStatus } from "../types";

/**
 * 사용자가 차단 되었는지 여부를 판단합니다.
 * 차단된 사용자는 이벤트에 한하여 서비스 이용에 제재를 받습니다.
 */
export const banMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const eventStatus = await eventStatusModel
      .findOne({ userId: req.userOid })
      .lean<EventStatus | null>();
    if (!eventStatus) {
      return res
        .status(400)
        .json({ error: "checkBanned: nonexistent eventStatus" });
    }
    if (eventStatus.isBanned) {
      return res.status(400).json({ error: "checkBanned: banned user" });
    }
    req.eventStatus = eventStatus;
    next();
  } catch (err) {
    logger.error("Error fetching event status", err);
    res.status(500).json({
      error: "checkBanned: internal server error",
    });
  }
};
