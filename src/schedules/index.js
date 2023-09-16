const cron = require("node-cron");
const logger = require("../modules/logger");

const registerSchedules = (app) => {
  cron.schedule("*/5 * * * *", require("./notifyBeforeDepart")(app));
  cron.schedule("*/10 * * * *", require("./notifyAfterArrival")(app));
  logger.info("[SCHEDULES] cron jobs were registered");
};

module.exports = registerSchedules;
