import type { RequestHandler } from "express";

import { validateServiceBanRecord } from "@/modules/ban";

import logger from "@/modules/logger";

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
    if (banErrorMessage !== undefined) {
      logger.info(
        `Banned at ${req.originalUrl}, banErrorMessage: ${banErrorMessage}`
      );
      return res.status(400).json({
        error: banErrorMessage,
      });
    }
  }
  // targetUrl: undefined or targetUrl: IsBannedCheck & banErrorMessage: string
  next();
};

export default banMiddleware;
