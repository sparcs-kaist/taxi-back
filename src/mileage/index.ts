import express from "express";

import transactionRouter from "./routes/transaction";
import summaryRouter from "./routes/summary";
import leaderboardRouter from "./routes/leaderboard";

import { appendMileageDocs } from "./routes/docs/index";

import { registerSchedules } from "./schedules/index";

import { authMiddleware } from "@/middlewares";

import { testFunction } from "./services/test";

testFunction();

registerSchedules();

const mileageRouter = express.Router();

appendMileageDocs();

mileageRouter.use("/leaderboard", leaderboardRouter);

// summary와 transaction에는 로그인이 필요함
mileageRouter.use(authMiddleware);
mileageRouter.use("/transaction", transactionRouter);
mileageRouter.use("/summary", summaryRouter);

export default mileageRouter;
