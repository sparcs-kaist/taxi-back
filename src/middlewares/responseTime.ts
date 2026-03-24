import type { Request, Response } from "express";
import responseTime from "response-time";
import { getLoginInfo } from "@/modules/auths/login";
import logger from "@/modules/logger";

const responseTimeMiddleware = responseTime(
  (req: Request, res: Response, time: number) => {
    const { method, originalUrl, clientIP } = req;
    const { statusCode } = res;
    const userId = getLoginInfo(req).id || "anonymous";
    logger.info(
      `${userId}(${clientIP}) "${method} ${originalUrl}" ${statusCode} on ${time}ms`
    );
  }
);

export default responseTimeMiddleware;
