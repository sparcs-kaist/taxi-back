const logger = require("../modules/logger");

const apiAccessLogMiddleware = (req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
};

module.exports = apiAccessLogMiddleware;
