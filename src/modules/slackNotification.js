const { nodeEnv, slackWebhookUrl: slackUrl } = require("../../loadenv");
const axios = require("axios");
const logger = require("../modules/logger");

const sendTextToReportChannel = (text) => {
  if (!slackUrl.report) return;

  const data = {
    text: nodeEnv === "production" ? text : `(${nodeEnv}) ${text}`, // Production 환경이 아닌 경우, 환경 이름을 붙여서 전송합니다.
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

const notifyReportToReportChannel = (reportUser, report) => {
  sendTextToReportChannel(
    `${reportUser}님으로부터 신고가 접수되었습니다.

    신고자 ID: ${report.creatorId}
    신고 ID: ${report.reportedId}
    방 ID: ${report.roomId ?? ""}
    사유: ${report.type}
    기타: ${report.etcDetail}`
  );
};

const notifyRoomCreationAbuseToReportChannel = (
  abusingUser,
  abusingUserNickname,
  { from, to, time, maxPartLength }
) => {
  sendTextToReportChannel(
    `${abusingUserNickname}님이 어뷰징이 의심되는 방을 생성하려고 시도했습니다.

    사용자 ID: ${abusingUser}
    출발지: ${from}
    도착지: ${to}
    출발 시간: ${time}
    최대 참여 가능 인원: ${maxPartLength}명`
  );
};

const notifyEmailFailureToReportChannel = (
  mailOption,
  report,
  error
) => {
  sendTextToReportChannel(
    `${mailOption.to}님께 보내려는 신고 메일이 실패했습니다.
    
    신고자 ID: ${report.creatorId}
    신고 ID: ${report.reportedId}
    방 ID: ${report.roomId ?? ""}
    사유: ${report.type}
    기타: ${report.etcDetail}

    문제 원인: ${error.message}
    `
  )
}

module.exports = {
  sendTextToReportChannel,
  notifyReportToReportChannel,
  notifyRoomCreationAbuseToReportChannel,
  notifyEmailFailureToReportChannel
};
