const logger = require("./logger");

const apiAccessLogMiddleware = (req, res, time) => {
  res.on("finish", () => {
    const { method, originalUrl } = req;
    const { statusCode } = res;
    const userId = req.session?.loginInfo?.id || "anonymous";
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    logger.info(
      `${userId}(${ip}) "${method} ${originalUrl}" ${statusCode} on ${time}ms`
    );
  });
};

module.exports = apiAccessLogMiddleware;
