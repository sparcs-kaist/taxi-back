import express from "express";

import transactionRouter from "./routes/transaction";
import summaryRouter from "./routes/summary";
import leaderboardRouter from "./routes/leaderboard";

import { appendMileageDocs } from "./routes/docs/index";

const mileageRouter = express.Router();

appendMileageDocs();

mileageRouter.use("/leaderboard", leaderboardRouter);
mileageRouter.use("/transaction", transactionRouter);
mileageRouter.use("/summary", summaryRouter);

export default mileageRouter;
