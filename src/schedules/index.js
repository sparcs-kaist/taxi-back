const cron = require("node-cron");

const registerSchedules = (app) => {
  cron.schedule("*/5 * * * *", require("./notifyBeforeDepart")(app));
  cron.schedule("*/10 * * * *", require("./notifyAfterArrival")(app));
  cron.schedule("*/2 * * * *", require("./closeRoomAutomatically")(app));

};

module.exports = registerSchedules;
