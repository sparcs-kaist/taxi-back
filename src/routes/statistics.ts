import express from "express";
import { authMiddleware, validateQuery } from "@/middlewares";
import * as statisticsHandlers from "@/services/statistics";
import { statisticsZod } from "./docs/schemas/statisticsSchema";

const router = express.Router();

//이 savings endpoint는 사용되지 않습니다...
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
  authMiddleware,
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
  authMiddleware,
  validateQuery(statisticsZod.userDoneRoomCountHandler),
  statisticsHandlers.userDoneRoomCountHandler
);

router.get(
  "/room-creation/hourly",
  validateQuery(statisticsZod.hourlyRoomCreationHandler),
  statisticsHandlers.hourlyRoomCreationHandler
);

export default router;
