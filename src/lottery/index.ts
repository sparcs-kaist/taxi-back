import express from "express";
import {
  eventStatusModel,
  questModel,
  transactionModel,
  quizModel,
  itemModel,
} from "./modules/stores/mongo";
import { buildResource } from "../modules/adminResource";
import { eventConfig } from "@/loadenv";

import {
  appendEventDocs,
  globalStateRouter,
  invitesRouter,
  itemsRouter,
  questsRouter,
  quizzesRouter,
  transactionsRouter,
} from "./routes";
import { originValidatorMiddleware as originValidator } from "../middlewares/originValidator";
import { registerSchedules } from "./schedules";
import * as contractsModule from "./modules/contracts";

export const contracts = eventConfig ? contractsModule : null;

if (eventConfig) {
  // [Routes] 기존 docs 라우터의 docs extend
  appendEventDocs();

  // [Schedule] 스케줄러 시작
  registerSchedules();
}

export const lotteryRouter = express.Router();

// [Middleware] 모든 API 요청에 대하여 origin 검증
lotteryRouter.use(originValidator);

// [Router] APIs
lotteryRouter.use("/globalState", globalStateRouter);
lotteryRouter.use("/invites", invitesRouter);
lotteryRouter.use("/transactions", transactionsRouter);
lotteryRouter.use("/items", itemsRouter);
// lotteryRouter.use("/publicNotice", require("./routes/publicNotice"));
lotteryRouter.use("/quests", questsRouter);
lotteryRouter.use("/quizzes", quizzesRouter);

// [AdminJS] AdminJS에 표시할 Resource 생성
export const resources = eventConfig
  ? [
      buildResource()(eventStatusModel),
      buildResource()(questModel),
      buildResource()(transactionModel),
      buildResource()(quizModel),
      buildResource()(itemModel),
    ]
  : [];
