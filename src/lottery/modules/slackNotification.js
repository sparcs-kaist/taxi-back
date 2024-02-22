const { sendTextToReportChannel } = require("../../modules/slackNotification");

const notifyAbuseDetectionResultToReportChannel = (
  abusingUsers,
  reports,
  reportedUserIds,
  rooms,
  multiplePartUserIds,
  lessChatRooms,
  lessChatUserIds
) => {
  // TODO
};

module.exports = {
  notifyAbuseDetectionResultToReportChannel,
};
