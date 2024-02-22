const cron = require("node-cron");

const registerSchedules = () => {
  cron.schedule("0 4 * * *", require("./detectAbusingUsers"));
};

module.exports = registerSchedules;
