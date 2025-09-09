import express from "express";

import transactionRouter from "./routes/transaction";
import summaryRouter from "./routes/summary";
import leaderboardRouter from "./routes/leaderboard";

const mileageRouter = express.Router();

mileageRouter.use("/leaderboard", leaderboardRouter);
mileageRouter.use("/transaction", transactionRouter);
mileageRouter.use("/summary", summaryRouter);

export default mileageRouter;
