import type { RequestHandler } from "express";

const informationMiddleware: RequestHandler = (req, res, next) => {
  req.clientIP =
    (req.headers["x-forwarded-for"] as string | undefined) ||
    req.connection.remoteAddress;
  req.timestamp = Date.now();
  next();
};

export default informationMiddleware;
