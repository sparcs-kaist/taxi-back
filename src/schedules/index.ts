import type { Express } from "express";
import cron from "node-cron";
import { naverMap } from "@/loadenv";
import notifyBeforeDepart from "./notifyBeforeDepart";
import notifyAfterArrival from "./notifyAfterArrival";
import updateMajorTaxiFare from "./updateMajorTaxiFare";
import updateMinorTaxiFare from "./updateMinorTaxiFare";
import autoSettlement from "./autoSettlement";

const registerSchedules = (app: Express) => {
  cron.schedule("*/5 * * * *", notifyBeforeDepart(app));
  cron.schedule("*/10 * * * *", notifyAfterArrival(app));
  cron.schedule("1,11,21,31,41,51 * * * *", autoSettlement(app));
  if (naverMap.apiId && naverMap.apiKey) {
    cron.schedule("0,30 * * * * ", updateMajorTaxiFare(app));
    cron.schedule("0 18 * * *", updateMinorTaxiFare(app));
  }
};

export default registerSchedules;
