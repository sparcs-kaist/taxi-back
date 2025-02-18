const cron = require("node-cron");

const registerSchedules = () => {
  cron.schedule("0 4 * * *", require("./detectAbusingUsers"));
  cron.schedule("56 23 * * *", require("./dailyQuiz").default);
};

module.exports = registerSchedules;
