const cron = require("node-cron");

const registerSchedules = (app) => {
  cron.schedule("*/5 * * * *", require("./notifyBeforeDepart")(app));
  cron.schedule("*/10 * * * *", require("./notifyAfterArrival")(app));
  cron.schedule("0,30 * * * * ", require("./updateMajorTaxiFare")(app));
  cron.schedule("0 18 * * *", require("./updateMinorTaxiFare")(app));
};

module.exports = registerSchedules;
