import { type Express } from "express";
import cron from "node-cron";
import notifyBeforeDepart from "./notifyBeforeDepart";
import notifyAfterArrival from "./notifyAfterArrival";
import updateMajorTaxiFare from "./updateMajorTaxiFare";
import updateMinorTaxiFare from "./updateMinorTaxiFare";
import config from "@/loadenv";

const registerSchedules = (app: Express) => {
  cron.schedule("*/5 * * * *", notifyBeforeDepart(app));
  cron.schedule("*/10 * * * *", notifyAfterArrival(app));
  if (config.naverMap.apiId && config.naverMap.apiKey) {
    cron.schedule("0,30 * * * * ", updateMajorTaxiFare(app));
    cron.schedule("0 18 * * *", updateMinorTaxiFare(app));
  }
};

export default registerSchedules;
