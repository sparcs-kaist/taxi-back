const cron = require("node-cron");
const {
  expression: sendReminderExpression,
  sendReminder,
} = require("./notifyBeforeDepart");

const registerSchedules = () => {
  cron.schedule(sendReminderExpression, sendReminder);
};

module.exports = registerSchedules;
