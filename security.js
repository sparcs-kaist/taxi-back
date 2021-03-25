require("dotenv").config()

module.exports.mongo = process.env.DB_PATH;
module.exports.session = process.env.SESSION_KEP;
