// 환경 변수에 따라 .env.production 또는 .env.development 파일을 읽어옴
require("dotenv").config({ path: `./.env.${process.env.NODE_ENV}` });

module.exports = {
  nodeEnv: process.env.NODE_ENV, // required
  mongo: process.env.DB_PATH, // required
  session: {
    secret: process.env.SESSION_KEY || "TAXI_SESSION_KEY", // optional
    expiry: 14 * 24 * 3600 * 1000, // 14일, ms 단위입니다.
  },
  redis: process.env.REDIS_PATH, // optional
  sparcssso: {
    id: process.env.SPARCSSSO_CLIENT_ID || "", // optional
    key: process.env.SPARCSSSO_CLIENT_KEY || "", // optional
  },
  port: process.env.PORT || 80, // optional (default = 80)
  corsWhiteList: (process.env.CORS_WHITELIST &&
    JSON.parse(process.env.CORS_WHITELIST)) || [true], // optional (default = [true])
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // required
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // required
    s3BucketName: process.env.AWS_S3_BUCKET_NAME, // required
    s3Url:
      process.env.AWS_S3_URL ||
      `https://${process.env.AWS_S3_BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com`, // optional
  },
  jwt: {
    secretKey: process.env.JWT_SECRET_KEY || "TAXI_JWT_KEY",
    option: {
      algorithm: "HS256",
      // FIXME: remove FRONT_URL from issuer. 단, issuer를 변경하면 이전에 발급했던 모든 JWT가 무효화됩니다.
      // See https://github.com/sparcs-kaist/taxi-back/issues/415
      issuer: process.env.FRONT_URL || "http://localhost:3000", // optional (default = "http://localhost:3000")
    },
    TOKEN_EXPIRED: -3,
    TOKEN_INVALID: -2,
  },
  googleApplicationCredentials:
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS), // optional
  testAccounts:
    (process.env.TEST_ACCOUNTS && JSON.parse(process.env.TEST_ACCOUNTS)) || [], // optional
  slackWebhookUrl: {
    report: process.env.SLACK_REPORT_WEBHOOK_URL || "", // optional
  },
  eventConfig: (process.env.EVENT_CONFIG &&
    JSON.parse(process.env.EVENT_CONFIG)) || {
    mode: "2024spring",
    startAt: "2024-02-16T00:00:00+09:00",
    endAt: "2024-03-19T00:00:00+09:00",
  }, // optional
};
