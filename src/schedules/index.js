const cron = require("node-cron");
const {
  expression: sendReminderExpression,
  sendReminder,
} = require("./notifyBeforeDepart");

const registerSchedules = (app) => {
  // cron.schedule("*/5 * * * *", require("./notifyBeforeDepart")(app));
  cron.schedule("* * * * *", require("./notifyBeforeDepart")(app));
};

module.exports = registerSchedules;
