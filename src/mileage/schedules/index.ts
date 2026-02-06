import * as cron from "node-cron";
import { getFareRoutine } from "./getTaxiFare";
import { naverMap } from "@/loadenv";

export const registerSchedules = () => {
  if (naverMap.apiId && naverMap.apiKey) {
    cron.schedule("*/30 * * * *", getFareRoutine);
  }
};
