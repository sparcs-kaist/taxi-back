import express from "express";
import type { Router } from "express";
import { validateBody } from "../../middlewares/zod";
import { globalStateZod } from "./docs/schemas/globalStateSchema";
import globalStateHandlers from "../services/globalState";
import authMiddleware from "../../middlewares/auth";
import timestampValidator from "../middlewares/timestampValidator";

const router: Router = express.Router();

router.get("/", globalStateHandlers.getUserGlobalStateHandler);

// 아래의 Endpoint 접근 시 로그인 및 시각 체크 필요
router.use(authMiddleware);
router.use(timestampValidator);

router.post(
  "/create",
  validateBody(globalStateZod.createUserGlobalStateHandler),
  globalStateHandlers.createUserGlobalStateHandler
);

export default router;
