import express from "express";
import { authMiddleware, validateQuery } from "@/middlewares";
import { statisticsZod } from "./docs/schemas/statisticsSchema";
import * as statisticsHandlers from "@/services/statistics";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/savings",
  validateQuery(statisticsZod.savingsHandler),
  statisticsHandlers.savingsHandler
);

router.get(
  "/savings/period",
  validateQuery(statisticsZod.savingsPeriodHandler),
  statisticsHandlers.savingsByPeriodHandler
);

router.get(
  "/savings/total",
  validateQuery(statisticsZod.savingsTotalHandler),
  statisticsHandlers.savingsTotalHandler
);

router.get(
  "/users/savings",
  validateQuery(statisticsZod.userSavingsHandler),
  statisticsHandlers.userSavingsHandler
);

router.get(
  "/room-creation/monthly",
  validateQuery(statisticsZod.monthlyRoomCreationHandler),
  statisticsHandlers.monthlyRoomCreationHandler
);

router.get(
  "/users/monthly",
  validateQuery(statisticsZod.monthlyUserCreationHandler),
  statisticsHandlers.monthlyUserCreationHandler
);

router.get(
  "/users/done-room-count",
  validateQuery(statisticsZod.userDoneRoomCountHandler),
  statisticsHandlers.userDoneRoomCountHandler
);

router.get(
  "/room-creation/hourly",
  validateQuery(statisticsZod.hourlyRoomCreationHandler),
  statisticsHandlers.hourlyRoomCreationHandler
);

export default router;
