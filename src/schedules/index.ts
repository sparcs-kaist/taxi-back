import { type Express } from "express";
import cron from "node-cron";
import notifyBeforeDepart from "./notifyBeforeDepart";
import notifyAfterArrival from "./notifyAfterArrival";

const registerSchedules = (app: Express) => {
  cron.schedule("*/5 * * * *", notifyBeforeDepart(app));
  cron.schedule("*/10 * * * *", notifyAfterArrival(app));
};

export default registerSchedules;
