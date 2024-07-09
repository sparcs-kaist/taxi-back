const cron = require("node-cron");
const { naverMapApiId, naverMapApiKey } = require("../../loadenv").naverMap;

const registerSchedules = (app) => {
  cron.schedule("*/5 * * * *", require("./notifyBeforeDepart")(app));
  cron.schedule("*/10 * * * *", require("./notifyAfterArrival")(app));
  if (naverMapApiId != false && naverMapApiKey != false) {
    cron.schedule("0,30 * * * * ", require("./updateMajorTaxiFare")(app));
    cron.schedule("0 18 * * *", require("./updateMinorTaxiFare")(app));
  }
};

module.exports = registerSchedules;
