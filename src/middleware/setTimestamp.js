module.exports = (req, _, next) => {
  const currentTime = Date.now();
  req.timestamp = currentTime;
  next();
};
