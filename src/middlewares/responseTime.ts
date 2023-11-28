import { type Request, type Response } from "express";
import logger from "@/modules/logger";
import responseTime from "response-time";

const responseTimeMiddleware = responseTime(
  (req: Request, res: Response, time: number) => {
    const { method, originalUrl, clientIP } = req;
    const { statusCode } = res;
    const userId = req.session?.loginInfo?.id || "anonymous";
    logger.info(
      `${userId}(${clientIP}) "${method} ${originalUrl}" ${statusCode} on ${time}ms`
    );
  }
);

export default responseTimeMiddleware;
