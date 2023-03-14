const logger = require("./logger");

const logAPIAccess = (req, res, time) => {
  const { method, originalUrl, clientIP } = req;
  const { statusCode } = res;
  const userId = req.session?.loginInfo?.id || "anonymous";
  logger.info(
    `${userId}(${clientIP}) "${method} ${originalUrl}" ${statusCode} on ${time}ms`
  );
};

module.exports = logAPIAccess;
