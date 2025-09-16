import type { RequestHandler } from "express";

import { validateServiceBanRecord } from "@/modules/ban";

import logger from "@/modules/logger";

const serviceMapper = new Map([
  ["/rooms/create", "service"],
  ["/rooms/join", "service"],
  ["/events/2025spring/globalState/create", "2025-spring-event"],
  ["/events/2025spring/invites/create", "2025-spring-event"],
  ["/events/2025spring/items/purchase", "2025-spring-event"],
  ["/events/2025spring/items/useCoupon", "2025-spring-event"],
  ["/events/2025spring/quests", "2025-spring-event"],
]);

type IsBannedCheck = {
  url: string;
  value: string;
};

const testBanArray: IsBannedCheck[] = [
  { url: "/rooms/create", value: "service" },
  { url: "/rooms/join", value: "service" },
  { url: "/events/2025spring/globalState/create", value: "2025-spring-event" },
  { url: "/events/2025spring/items/purchase", value: "2025-spring-event" },
  { url: "/events/2025spring/items/purchase", value: "2025-spring-event" },
  { url: "/events/2025spring/items/useCoupon", value: "2025-spring-event" },
  { url: "/events/2025spring/quests", value: "2025-spring-event" },
];

const banMiddleware: RequestHandler = async (req, res, next) => {
  const targetUrl = testBanArray.find((banArray) =>
    req.originalUrl.startsWith(banArray.url)
  );
  if (targetUrl !== undefined) {
    const banErrorMessage = await validateServiceBanRecord(
      req,
      targetUrl.value
    );
    logger.info(
      `originalUrl: ${req.originalUrl}, target: ${targetUrl.value}, banErrorMessage: ${banErrorMessage}`
    );
    if (banErrorMessage !== undefined) {
      logger.info(`banErrorMessage: ${banErrorMessage}`);
      logger.info(`Banned at ${req.originalUrl}`);
      return res.status(400).json({
        error: banErrorMessage,
      });
    }
  }
  // targetUrl: undefined or targetUrl: IsBannedCheck & banErrorMessage: string
  next();
};

export default banMiddleware;
