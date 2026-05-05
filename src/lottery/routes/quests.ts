import express from "express";
import { validateParams } from "../../middlewares/zod";
import { questsZod } from "./docs/schemas/questsSchema";
import { completeQuestHandler } from "../services/quests";

import { authMiddleware } from "@/middlewares";
import { timestampValidator, banMiddleware } from "../middlewares";

const router = express.Router();

// 아래의 Endpoint 접근 시 로그인, 차단 여부 및 시각 체크 필요
router.use(authMiddleware);
router.use(banMiddleware);
router.use(timestampValidator);

router.post(
  "/complete/:questId",
  validateParams(questsZod.completeQuestHandler),
  completeQuestHandler
);

export default router;
