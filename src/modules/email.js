const nodemailer = require("nodemailer");
const logger = require("./logger");
const { nodeEnv } = require("../../loadenv");

/**
 * production 환경에서 메일을 전송하기 위해 사용되는 agent입니다.
 */
class NodemailerTransport {
  /** 메일 전송을 위한 agent 객체로, private 필드입니다. */
  #transporter;

  constructor() {
    this.#transporter = nodemailer.createTransport({
      host: "smtp-relay.gmail.com",
      secure: true,
      port: 587,
    });
  }

  /**
   * 이메일을 전송합니다.
   * @param {nodemailer.SendMailOptions} mailOptions - 메일 전송에 필요한 주소, 제목, 본문 등 정보입니다.
   * @return {Promise<boolean>} 이메일 전송에 성공하면 true를, 실패하면 false를 반환합니다.
   */
  async sendMail(mailOptions) {
    try {
      await this.#transporter.sendMail(mailOptions);
      return true;
    } catch (err) {
      logger.error(`Failed to send email: ${err}`);
      return false;
    }
  }
}

/**
 * development, test 환경에서 메일을 전송하기 위해 사용되는 agent입니다.
 *
 * Gmail relay 서버를 사용한 이메일 전송은 production 서버의 ip에서만 허용됩니다.
 * 그 외 환경에서는 Ethereal mock 서버를 사용해 이메일 전송을 테스트합니다.
 */
class MockNodemailerTransport {
  /** 메일 전송을 위한 agent 객체를 생성하는 Promise로, private 필드입니다. */
  #transporterPromise;

  constructor() {
    this.#transporterPromise = null;
  }

  /**
   * 이메일 전송을 위한 agent 객체를 생성합니다.
   * mock 이메일 전송을 위한 테스트 계정을 생성하기 위해 비동기 함수로 작성되었습니다.
   * @return {Promise<nodemailer.Transporter>} agent 객체를 생성하는 Promise입니다.
   * @throws {Error} 이메일 전송을 위한 agent 객체 생성에 실패하면 에러를 반환합니다.
   */
  async getTransporter() {
    if (!this.#transporterPromise) {
      this.#transporterPromise = nodemailer
        .createTestAccount()
        .then((account) => {
          return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
              user: account.user,
              pass: account.pass,
            },
          });
        })
        .catch((err) => {
          // 네트워크 오류 등으로 mock 메일 전송을 위한 agent 객체 생성에 실패했을 때 에러를 반환합니다.
          // sendMail 메서드가 다시 호출될 때 새로운 transporterPromise를 생성하기 위해 null로 초기화합니다.
          logger.error("Failed to create agent object for sending mock mail.");
          this.#transporterPromise = null;
          throw err;
        });
      return this.#transporterPromise;
    } else {
      // 이미 다른 caller에서 transporterPromise를 생성했다면 해당 Promise를 반환합니다.
      return this.#transporterPromise;
    }
  }

  /**
   * 이메일을 전송합니다.
   * @param {nodemailer.SendMailOptions} mailOptions - 메일 전송에 필요한 주소, 제목, 본문 등 정보입니다.
   * @return {Promise<boolean>} 이메일 전송에 성공하면 true를, 실패하면 false를 반환합니다.
   */
  async sendMail(mailOptions) {
    try {
      const transporter = await this.getTransporter();
      const response = await transporter.sendMail(mailOptions);
      logger.info(
        `Mock mail sent successfully. Preview url: ${nodeEnv.getTestMessageUrl(
          response
        )}`
      );
      return true;
    } catch (err) {
      logger.error(`Failed to send email: ${err}`);
      return false;
    }
  }
}

/** 메일 전송을 위한 agent 객체입니다. */
const transporter =
  nodeEnv === "production"
    ? new NodemailerTransport()
    : new MockNodemailerTransport();

/**
 * 이메일을 전송합니다.
 * @param {string} reportedEmail - 신고를 받은 사용자의 이메일입니다.
 * @param {object} report - 신고 내용입니다.
 * @param {string} report.type - 신고 유형입니다. reportTypeMap의 키여야 합니다.
 * @param {string} html - HTML 형식의 이메일 본문입니다.
 * @return {Promise<boolean>} 이메일 전송에 성공하면 true를, 실패하면 false를 반환합니다.
 */
const sendReportEmail = async (reportedEmail, report, html) => {
  const reportTypeMap = {
    "no-settlement": "정산을 하지 않음",
    "no-show": "택시에 동승하지 않음",
    "etc-reason": "기타 사유",
  };

  return transporter.sendMail({
    from: "taxi@sparcs.org",
    to: reportedEmail,
    subject: `[SPARCS TAXI] 신고가 접수되었습니다 (사유: ${
      reportTypeMap[report.type]
    })`,
    html,
  });
};

module.exports = {
  sendReportEmail,
};
