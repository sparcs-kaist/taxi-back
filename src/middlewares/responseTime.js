const logger = require("@/modules/logger");
const responseTime = require("response-time");

module.exports = responseTime((req, res, time) => {
  const { method, originalUrl, clientIP } = req;
  const { statusCode } = res;
  const userId = req.session?.loginInfo?.id || "anonymous";
  logger.info(
    `${userId}(${clientIP}) "${method} ${originalUrl}" ${statusCode} on ${time}ms`
  );
});
