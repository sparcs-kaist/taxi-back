// 환경 변수에 따라 .env.production 또는 .env.development 파일을 읽어옵니다.
import dotenv from "dotenv";
import type { ServiceAccount } from "firebase-admin";
import type { Algorithm } from "jsonwebtoken";

if (process.env.NODE_ENV === undefined) {
  // logger.ts가 아직 초기화되지 않았으므로 console.error를 사용합니다.
  // eslint-disable-next-line no-console
  console.error("There is no NODE_ENV environment variable.");
  process.exit(1);
}
dotenv.config({ path: `./.env.${process.env.NODE_ENV}` });

if (process.env.DB_PATH === undefined) {
  // logger.ts가 아직 초기화되지 않았으므로 console.error를 사용합니다.
  // eslint-disable-next-line no-console
  console.error("There is no DB_PATH environment variable.");
  process.exit(1);
}

export const frontUrl = process.env.FRONT_URL || "http://localhost:3000"; // optional
export const nodeEnv = process.env.NODE_ENV; // required ("production" or "development" or "test")
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
export const port = parseInt(process.env.PORT || "80", 10); // optional (default = 80)
export const corsWhiteList = (process.env.CORS_WHITELIST &&
  (JSON.parse(process.env.CORS_WHITELIST) as string[])) || [true]; // optional (default = [true])
export const aws = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID as string, // required
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string, // required
  s3BucketName: process.env.AWS_S3_BUCKET_NAME as string, // required
  s3Url:
    process.env.AWS_S3_URL ||
    `https://${process.env.AWS_S3_BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com`, // optional
};
export const jwt = {
  secretKey: process.env.JWT_SECRET_KEY || "TAXI_JWT_KEY", // optional
  option: {
    algorithm: "HS256" as Algorithm,
    issuer: frontUrl,
  },
  TOKEN_EXPIRED: -3 as const,
  TOKEN_INVALID: -2 as const,
};
export const googleApplicationCredentials =
  process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  (JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS) as ServiceAccount); // optional
export const testAccounts =
  (process.env.TEST_ACCOUNTS &&
    (JSON.parse(process.env.TEST_ACCOUNTS) as string[])) ||
  []; // optional
export const slackWebhookUrl = {
  report: process.env.SLACK_REPORT_WEBHOOK_URL || "", // optional
};
export const eventConfig = (process.env.EVENT_CONFIG &&
  JSON.parse(process.env.EVENT_CONFIG)) || {
  mode: "2025fall",
  credit: { name: "응모권", initialAmount: 0 },
  period: {
    startAt: "2025-09-01T00:00:00+09:00",
    endAt: "2025-10-30T00:00:00+09:00",
  },
};
export const naverMap = {
  apiId: process.env.NAVER_MAP_API_ID || "", // optional
  apiKey: process.env.NAVER_MAP_API_KEY || "", // optional
};
export const oneApp = {
  secretKey: process.env.ONEAPP_TOKEN_SECRET || "SPARCS_APP", // optional
  refreshTokenExpiry: 30 * 24 * 3600 * 1000, // 30일, ms 단위입니다.
};
