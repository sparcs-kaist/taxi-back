// 환경 변수에 따라 .env.production 또는 .env.development 파일을 읽어옵니다.
import dotenv from "dotenv";
import { type Algorithm } from "jsonwebtoken";
import { type ServiceAccount } from "firebase-admin";
import exp from "constants";

if (process.env.NODE_ENV === undefined) {
  // logger.ts가 아직 초기화되지 않았으므로 console.error를 사용합니다.
  // eslint-disable-next-line no-console
  console.error("NODE_ENV 환경변수가 설정되어 있지 않습니다.");
  process.exit(1);
}
dotenv.config({ path: `./.env.${process.env.NODE_ENV}` });

if (process.env.DB_PATH === undefined) {
  // logger.ts가 아직 초기화되지 않았으므로 console.error를 사용합니다.
  // eslint-disable-next-line no-console
  console.error("DB_PATH 환경변수가 설정되어 있지 않습니다.");
  process.exit(1);
}

const config = {
  nodeEnv: process.env.NODE_ENV,
  mongoUrl: process.env.DB_PATH,
  session: {
    secret: process.env.SESSION_KEY || "TAXI_SESSION_KEY",
    expiry: 14 * 24 * 3600 * 1000,
  },
  redisUrl: process.env.REDIS_PATH,
  sparcssso: {
    id: process.env.SPARCSSSO_CLIENT_ID || "",
    key: process.env.SPARCSSSO_CLIENT_KEY || "",
  },
  port: process.env.PORT ? parseInt(process.env.PORT) : 80,
  corsWhiteList: (process.env.CORS_WHITELIST &&
    (JSON.parse(process.env.CORS_WHITELIST) as string[])) || [true],
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME as string,
    s3Url:
      process.env.AWS_S3_URL ||
      `https://${process.env.AWS_S3_BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com`,
  },
  jwt: {
    secretKey: process.env.JWT_SECRET || "TAXI_JWT_KEY",
    option: {
      algorithm: "HS256" as Algorithm,
      // FIXME: remove FRONT_URL from issuer. 단, issuer를 변경하면 이전에 발급했던 모든 JWT가 무효화됩니다.
      // See https://github.com/sparcs-kaist/taxi-back/issues/415
      issuer: process.env.FRONT_URL || "http://localhost:3000",
    },
    TOKEN_EXPIRED: -3,
    TOKEN_INVALID: -2,
  },

  googleApplicationCredentials:
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    (JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS) as ServiceAccount),
  testAccounts:
    (process.env.TEST_ACCOUNTS &&
      (JSON.parse(process.env.TEST_ACCOUNTS) as string[])) ||
    [],
  slackWebhookUrl: {
    report: process.env.SLACK_REPORT_WEBHOOK_URL || "",
  },
  naverMap: {
    apiId: process.env.NAVER_MAP_API_ID || "",
    apiKey: process.env.NAVER_MAP_API_KEY || "",
  },
};

export default config;