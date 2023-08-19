var cors = require("cors");
const { corsWhiteList } = require("../../loadenv");

module.exports = cors({
  origin: corsWhiteList,
  credentials: true,
  exposedHeaders: ["Date"],
});
