const cron = require("node-cron");

const registerSchedules = (app) => {
  cron.schedule("*/5 * * * *", require("./notifyBeforeDepart")(app));
  cron.schedule("*/10 * * * *", require("./notifyAfterArrival")(app));
  cron.schedule("*/15 * * * *", require("./autoProcessingRoom")(app));
};

module.exports = registerSchedules;
