const { validateServiceBanRecord } = require("../modules/ban");

const banMiddleware = async (req, res, next) => {
  console.log(`req.originalUrl: ${req.originalUrl}`);
  const serviceMapper = {
    "/rooms/create": "service",
    "/rooms/join": "service",
  };
  const banErrorMessage = await validateServiceBanRecord(
    req,
    serviceMapper[req.originalUrl]
  );
  if (banErrorMessage !== undefined) {
    console.log("banned user");
    return res.status(400).json({ error: banErrorMessage });
  }
  console.log("next()");
  next();
};

module.exports = banMiddleware;
