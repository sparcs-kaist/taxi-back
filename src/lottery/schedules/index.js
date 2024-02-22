const cron = require("node-cron");

const registerSchedules = () => {
  //cron.schedule("0 4 * * *", require("./detectAbusingUsers"));
  cron.schedule("* * * * *", require("./detectAbusingUsers")); // Test purpose
};

module.exports = registerSchedules;
