import express from "express";

import transactionRouter from "./routes/transaction";
import summaryRouter from "./routes/summary";
import leaderboardRouter from "./routes/leaderboard";
import { testTransactionGenerator } from "./services/test";

const mileageRouter = express.Router();

mileageRouter.get("/get", testTransactionGenerator);
mileageRouter.use("/leaderboard", leaderboardRouter);
mileageRouter.use("/transaction", transactionRouter);
mileageRouter.use("/summary", summaryRouter);

export default mileageRouter;
