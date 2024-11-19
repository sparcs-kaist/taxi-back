import type { RequestHandler } from "express";
import { validateServiceBanRecord } from "@/modules/ban";
import logger from "@/modules/logger";

const serviceMapper: Map<string, string> = new Map([
  ["/rooms/create", "service"],
  ["/rooms/join", "service"],
]);

const banMiddleware: RequestHandler = async (req, res, next) => {
  if (req.originalUrl === undefined) {
    logger.error(
      "Error occured while validateServiceBanRecord: req.originalUrl is undefined"
    );
    return res.status(500).json({
      error:
        "Error occured while validateServiceBanRecord: req.originalUrl is undefined",
    });
  }
  const banErrorMessage = await validateServiceBanRecord(
    req,
    serviceMapper.get(req.originalUrl) || ""
  );
  if (banErrorMessage !== undefined) {
    return res.status(400).json({ error: banErrorMessage });
  }
  next();
};

module.exports = banMiddleware;
