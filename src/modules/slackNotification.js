const { slackWebhookUrl: slackUrl } = require("@/loadenv");
const axios = require("axios");
const logger = require("./logger");

module.exports.notifyToReportChannel = (reportUser, report) => {
  if (!slackUrl.report) return;

  const data = {
    text: `${reportUser}님으로부터 신고가 접수되었습니다.

    신고자 ID: ${report.creatorId}
    신고 ID: ${report.reportedId}
    방 ID: ${report.roomId ?? ""}
    사유: ${report.type}
    기타: ${report.etcDetail}
    `,
  };
  const config = { "Content-Type": "application/json" };

  axios
    .post(slackUrl.report, data, config)
    .then((res) => {
      logger.info("Slack webhook sent successfully");
    })
    .catch((err) => {
      logger.error("Fail to send slack webhook", err);
    });
};
