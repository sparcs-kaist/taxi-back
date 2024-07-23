const cron = require("node-cron");

const registerSchedules = (app) => {
  cron.schedule("*/5 * * * *", require("./notifyBeforeDepart")(app));
  cron.schedule("*/10 * * * *", require("./notifyAfterArrival")(app));
  cron.schedule("0 0 1 * *", require("./deleteUserInfo"));
};

module.exports = registerSchedules;
