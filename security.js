require("dotenv").config()

module.exports.mongo = process.env.DB_PATH;
module.exports.session = process.env.SESSION_KEY;
module.exports.sparcssso_id = process.env.SPARCSSSO_CLIENT_ID;
module.exports.sparcssso_key = process.env.SPARCSSSO_CLIENT_KEY;
module.exports.sparcssso_replace = process.env.SPARCSSSO_REPLACE;
module.exports.nodePort = process.env.NODE_PORT;
module.exports.frontUrl = process.env.FRONT_URL;