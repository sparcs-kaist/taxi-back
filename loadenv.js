// 환경 변수에 따라 .env.production 또는 .env.development 파일을 읽어옴
require("dotenv").config({ path: `./.env.${process.env.NODE_ENV}` });

module.exports = {
  nodeEnv: process.env.NODE_ENV,
  mongo: process.env.DB_PATH, // required
  session: process.env.SESSION_KEY || "TAXI_SESSION_KEY", // optional
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
  eventMode: undefined,
  eventIds: {
    // required if eventMode === "2023fall"
    firstLogin: process.env.EVENT_2023FALL_FIRST_LOGIN_ID,
    payingAndSending: process.env.EVENT_2023FALL_PAYING_AND_SENDING_ID,
    firstRoomCreation: process.env.EVENT_2023FALL_FIRST_ROOM_CREATION_ID,
    roomSharing: process.env.EVENT_2023FALL_ROOM_SHARING_ID,
    paying: process.env.EVENT_2023FALL_PAYING_ID,
    sending: process.env.EVENT_2023FALL_SENDING_ID,
    nicknameChanging: process.env.EVENT_2023FALL_NICKNAME_CHANGING_ID,
    accountChanging: process.env.EVENT_2023FALL_ACCOUNT_CHANGING_ID,
    adPushAgreement: process.env.EVENT_2023FALL_AD_PUSH_AGREEMENT_ID,
    eventSharingOnInstagram:
      process.env.EVENT_2023FALL_EVENT_SHARING_ON_INSTAGRAM_ID,
    purchaseSharingOnInstagram:
      process.env.EVENT_2023FALL_PURCHASE_SHARING_ON_INSTAGRAM_ID,
  },
};
