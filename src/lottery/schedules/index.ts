import cron from "node-cron";

import detectAbusingUsers from "./detectAbusingUsers";
import dailyQuiz from "./dailyQuiz";

export const registerSchedules = () => {
  cron.schedule("0 4 * * *", detectAbusingUsers);
  cron.schedule("58 23 * * *", dailyQuiz);
};
