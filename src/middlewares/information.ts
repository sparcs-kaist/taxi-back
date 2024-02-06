import { type Request, type Response, type NextFunction } from "express";

const informationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.clientIP =
    (req.headers["x-forwarded-for"] as string | undefined) ||
    req.connection.remoteAddress;
  req.timestamp = Date.now();
  next();
};

export default informationMiddleware;
