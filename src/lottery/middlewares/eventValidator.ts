import type { RequestHandler } from "express";
import { eventStatusModel } from "../modules/stores/mongo";
import logger from "@/modules/logger";

/**
 * 사용자가 차단 되었는지 여부를 판단합니다.
 * 차단된 사용자는 이벤트에 한하여 서비스 이용에 제재를 받습니다.
 * @param req  eventStatus가 성공적일 경우 req.eventStatus = eventStatus로 들어갑니다.
 * @param res
 * @param next
 * @returns
 */
const eventValidateMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const eventStatus = await eventStatusModel
      .findOne({ userId: req.userOid })
      .lean();

    if (!eventStatus) {
      return res
        .status(400)
        .json({ error: "eventValidator: nonexistent eventStatus" });
    }

    req.eventStatus = eventStatus;
    next();
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "eventValidator: internal server error",
    });
  }
};

export default eventValidateMiddleware;
