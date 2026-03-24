import type { RequestHandler } from "express";
import { validateServiceBanRecord } from "@/modules/ban";
import type { Ban } from "@/types/mongo";
import logger from "@/modules/logger";

type IsBannedCheck = {
  url: string;
  value: Ban["serviceName"];
};

const testBanArray: IsBannedCheck[] = [
  { url: "/rooms/create", value: "service" },
  { url: "/rooms/join", value: "service" },
  { url: "/events/2025fall/globalState/create", value: "2025-fall-event" },
  { url: "/events/2025fall/items/purchase", value: "2025-fall-event" },
  { url: "/events/2025fall/items/useCoupon", value: "2025-fall-event" },
  // { url: "/events/2025fall/quests", value: "2025-fall-event" }, // No quiz at 2025-fall-event
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
      return res.status(403).json({
        error: banErrorMessage,
      });
    }
  }
  // targetUrl: undefined or targetUrl: IsBannedCheck & banErrorMessage: string
  next();
};

export default banMiddleware;
