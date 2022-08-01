const logger = require("./logger");

const logAPIAccess = (req, res, time) => {
  const { method, originalUrl } = req;
  const { statusCode } = res;
  const userId = req.session?.loginInfo?.id || "anonymous";
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  logger.info(
    `${userId}(${ip}) "${method} ${originalUrl}" ${statusCode} on ${time}ms`
  );
};

module.exports = logAPIAccess;
