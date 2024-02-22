const { sendTextToReportChannel } = require("../../modules/slackNotification");

const notifyAbuseDetectionResultToReportChannel = (
  abusingUsers,
  reports,
  reportedUserIds,
  multiplePartUserIds,
  lessChatUsers
) => {
  sendTextToReportChannel(
    `어뷰징 사용자 자동 감지가 완료되었습니다.

    *전체 어뷰징 사용자 수: ${abusingUsers.length}명*

    *"기타 사유"로 신고받은 사용자 (${reportedUserIds.length}명):*
    ${reportd}
    `
  );
};

module.exports = {
  notifyAbuseDetectionResultToReportChannel,
};
