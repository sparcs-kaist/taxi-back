import type { RequestHandler } from "express";

import { validateServiceBanRecord } from "@/modules/ban";

const serviceMapper = new Map([
  ["/rooms/create", "service"],
  ["/rooms/join", "service"],
  ["/events/2025spring", "2025-spring-event"],
]);

const banMiddleware: RequestHandler = async (req, res, next) => {
  serviceMapper.forEach(async (value, key, map) => {
    if (req.originalUrl.startsWith(key)) {
      console.log(`banned: ${key}`);

      const banErrorMessage = await validateServiceBanRecord(
        req,
        value
      );
      
      if (banErrorMessage !== undefined) {
        return res.status(400).json({ error: banErrorMessage });
      }
      
    }
    else {
      console.log(`not banned: ${key}`);
    }
  });
  console.log('next');
  next();
};

export default banMiddleware;
