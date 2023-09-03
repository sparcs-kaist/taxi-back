module.exports = (req, res, next) => {
  req.clientIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  req.timestamp = Date.now();
  next();
};
