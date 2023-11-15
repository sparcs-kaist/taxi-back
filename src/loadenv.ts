// 환경 변수에 따라 .env.production 또는 .env.development 파일을 읽어옵니다.
import dotenv from "dotenv";

if (process.env.NODE_ENV === undefined) {
  // logger.ts가 아직 초기화되지 않았으므로 console.error를 사용합니다.
  console.error("NODE_ENV 환경변수가 설정되어 있지 않습니다.");
  process.exit(1);
}
dotenv.config({ path: `./.env.${process.env.NODE_ENV}` });

if (process.env.DB_PATH === undefined) {
  // logger.ts가 아직 초기화되지 않았으므로 console.error를 사용합니다.
  console.error("DB_PATH 환경변수가 설정되어 있지 않습니다.");
  process.exit(1);
}

export const nodeEnv = process.env.NODE_ENV; // required
export const mongo = process.env.DB_PATH; // required
export const session = {
  secret: process.env.SESSION_KEY || "TAXI_SESSION_KEY", // optional
  expiry: 14 * 24 * 3600 * 1000, // 14일, ms 단위입니다.
};
export const redis = process.env.REDIS_PATH; // optional
export const sparcssso = {
  id: process.env.SPARCSSSO_CLIENT_ID || "", // optional
  key: process.env.SPARCSSSO_CLIENT_KEY || "", // optional
};
export const port = process.env.PORT ? parseInt(process.env.PORT) : 80; // optional (default = 80)
export const corsWhiteList = (process.env.CORS_WHITELIST &&
  JSON.parse(process.env.CORS_WHITELIST)) || [true]; // optional (default = [true])
export const aws = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // required
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // required
  s3BucketName: process.env.AWS_S3_BUCKET_NAME, // required
  s3Url:
    process.env.AWS_S3_URL ||
    `https://${process.env.AWS_S3_BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com`, // optional
};
export const jwt = {
  secretKey: process.env.JWT_SECRET_KEY || "TAXI_JWT_KEY",
  option: {
    algorithm: "HS256",
    // FIXME: remove FRONT_URL from issuer. 단, issuer를 변경하면 이전에 발급했던 모든 JWT가 무효화됩니다.
    // See https://github.com/sparcs-kaist/taxi-back/issues/415
    issuer: process.env.FRONT_URL || "http://localhost:3000", // optional (default = "http://localhost:3000")
  },
  TOKEN_EXPIRED: -3,
  TOKEN_INVALID: -2,
};
export const googleApplicationCredentials =
  process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS); // optional
export const testAccounts =
  (process.env.TEST_ACCOUNTS && JSON.parse(process.env.TEST_ACCOUNTS)) || []; // optional
export const slackWebhookUrl = {
  report: process.env.SLACK_REPORT_WEBHOOK_URL || "", // optional
};
export const eventConfig =
  process.env.EVENT_CONFIG && JSON.parse(process.env.EVENT_CONFIG);
