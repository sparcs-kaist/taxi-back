import { Express } from "express";
import cron from "node-cron";

const registerSchedules = (app: Express) => {
  cron.schedule("*/5 * * * *", require("./notifyBeforeDepart")(app));
  cron.schedule("*/10 * * * *", require("./notifyAfterArrival")(app));
};

export default registerSchedules;
