require("dotenv").config();

module.exports = {
  mongo: process.env.DB_PATH,
  session: process.env.SESSION_KEY,
  sparcssso_id: process.env.SPARCSSSO_CLIENT_ID,
  sparcssso_key: process.env.SPARCSSSO_CLIENT_KEY,
  sparcssso_replace: process.env.SPARCSSSO_REPLACE,
  nodePort: process.env.NODE_PORT,
  frontUrl: process.env.FRONT_URL
}
