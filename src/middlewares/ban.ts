import type { RequestHandler } from "express";

import { validateServiceBanRecord } from "@/modules/ban";

const serviceMapper = new Map([
  ["/rooms/create", "service"],
  ["/rooms/join", "service"],
  ["/events/2025spring/globalState/create", "2025-spring-event"],
  ["/events/2025spring/invites/create", "2025-spring-event"],
  ["/events/2025spring/items/purchase", "2025-spring-event"],
  ["/events/2025spring/items/useCoupon", "2025-spring-event"],
  ["/events/2025spring/quests", "2025-spring-event"],
]);

const banMiddleware: RequestHandler = async (req, res, next) => {
  let responseSent = false;
  let count = 0;

  console.log(req.originalUrl);

  serviceMapper.forEach(async (value, key, map) => {
    if (responseSent) return;

    if (req.originalUrl.startsWith(key)) {
      const banErrorMessage = await validateServiceBanRecord(req, value);
      console.log(`banErrorMessage: ${banErrorMessage}`);

      if (banErrorMessage !== undefined) {
        responseSent = true;
        console.log(`Banned at ${req.originalUrl}`);
        return res.status(400).json({ error: banErrorMessage });
      }
    }
    count++;

    if (count == serviceMapper.size) {
      next();
    }
  });
};

export default banMiddleware;
