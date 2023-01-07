require("dotenv").config({ path: `./.env.${process.env.NODE_ENV}` }); // 환경 변수에 따라 .env.production/.env.development 파일을 읽어옴

module.exports = {
  nodeEnv: process.env.NODE_ENV,
  mongo: process.env.DB_PATH,
  session: process.env.SESSION_KEY,
  redis: process.env.REDIS_PATH,
  sparcssso: {
    id: process.env.SPARCSSSO_CLIENT_ID,
    key: process.env.SPARCSSSO_CLIENT_KEY,
  },
  port: process.env.PORT,
  frontUrl: process.env.FRONT_URL,
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME,
  },
  jwtSecretKey: process.env.JWT_SECRET_KEY,
  appUriScheme: process.env.APP_URI_SCHEME,
};
