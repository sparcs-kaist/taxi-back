import express from "express";
import type { Router } from "express";
import {
  eventStatusModel,
  questModel,
  itemModel,
  transactionModel,
  quizModel,
} from "./modules/stores/mongo";
import { buildResource } from "../modules/adminResource";
import { addOneItemStockAction, addFiveItemStockAction } from "./modules/items";
import { eventConfig } from "@/loadenv";

import globalStateRouter from "./routes/globalState";
import invitesRouter from "./routes/invites";
import transactionsRouter from "./routes/transactions";
import itemsRouter from "./routes/items";
import questsRouter from "./routes/quests";
import quizzesRouter from "./routes/quizzes";
import originValidator from "../middlewares/originValidator";

export const contracts = eventConfig
  ? require("./modules/contracts")
  : undefined;

// [Routes] 기존 docs 라우터의 docs extend
eventConfig && require("./routes/docs")();

// [Schedule] 스케줄러 시작
eventConfig && require("./schedules")();

export const lotteryRouter: Router = express.Router();

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
      buildResource([addOneItemStockAction, addFiveItemStockAction])(itemModel),
      buildResource()(transactionModel),
      buildResource()(quizModel),
    ]
  : [];
