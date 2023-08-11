module.exports = (req, res, next) => {
  req.clientIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  req.timestamp = Date.now();
  req.origin =
    req.headers.origin ||
    req.headers.referer ||
    req.session?.loginAfterState?.redirectOrigin; // sparcssso/callback 요청은 헤더에 origin이 없음

  if (!req.origin) {
    return res.status(412).json({
      error: "Precondition Failed : request must have origin in header",
    });
  }
  next();
};
