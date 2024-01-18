const healthCheckHandler = (_, res) => {
  res.status(200).send("OK");
};

module.exports = {
  healthCheckHandler,
};
