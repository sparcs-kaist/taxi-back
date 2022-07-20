require("dotenv").config({ path: `./.env.${process.env.NODE_ENV}` }); // 환경 변수에 따라 .env.production/.env.development 파일을 읽어옴

module.exports = {
  mongo: process.env.DB_PATH,
  session: process.env.SESSION_KEY,
  sparcssso_id: process.env.SPARCSSSO_CLIENT_ID,
  sparcssso_key: process.env.SPARCSSSO_CLIENT_KEY,
  sparcssso_replace: process.env.SPARCSSSO_REPLACE,
  nodePort: process.env.NODE_PORT,
  frontUrl: process.env.FRONT_URL,
};
