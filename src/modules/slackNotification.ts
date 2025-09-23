import axios from "axios";
import { nodeEnv, slackWebhookUrl as slackUrl } from "@/loadenv";
import logger from "@/modules/logger";
import type { Report } from "@/types/mongo";
import type { SendMailOptions } from "nodemailer";

export const sendTextToReportChannel = (text: string) => {
  if (!slackUrl.report) return;

  const data = {
    text: nodeEnv === "production" ? text : `(${nodeEnv}) ${text}`, // Production 환경이 아닌 경우, 환경 이름을 붙여서 전송합니다.
  };
  const config = { headers: { "Content-Type": "application/json" } };

  axios
    .post(slackUrl.report, data, config)
    .then(() => {
      logger.info("Slack webhook sent successfully");
    })
    .catch((err) => {
      logger.error("Fail to send slack webhook", err);
    });
};

export const notifyReportToReportChannel = (
  reportUser: string,
  report: Report
) => {
  sendTextToReportChannel(
    `${reportUser}님으로부터 신고가 접수되었습니다.

    신고자 ID: ${report.creatorId}
    신고 ID: ${report.reportedId}
    방 ID: ${report.roomId ?? ""}
    사유: ${report.type}
    기타: ${report.etcDetail}`
  );
};

interface RoomType {
  from: string;
  to: string;
  time: Date;
  maxPartLength: number;
}

export const notifyRoomCreationAbuseToReportChannel = (
  abusingUser: string,
  abusingUserNickname: string,
  { from, to, time, maxPartLength }: RoomType
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

export const notifyEmailFailureToReportChannel = (
  to: SendMailOptions["to"],
  report: Report,
  error: Error
) => {
  sendTextToReportChannel(
    `${to}님께 보내려는 신고 메일이 실패했습니다.
    
    Report ID: ${report._id}
    문제 원인: ${error.message}`
  );
};
