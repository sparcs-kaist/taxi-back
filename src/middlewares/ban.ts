import type { RequestHandler } from "express";
import { validateServiceBanRecord } from "@/modules/ban";

const serviceMapper = new Map([
  ["/rooms/create", "service"],
  ["/rooms/join", "service"],
]);

const banMiddleware: RequestHandler = async (req, res, next) => {
  const banErrorMessage = await validateServiceBanRecord(
    req,
    serviceMapper.get(req.originalUrl) || ""
  );
  if (banErrorMessage !== undefined) {
    return res.status(400).json({ error: banErrorMessage });
  }
  next();
};

export default banMiddleware;
