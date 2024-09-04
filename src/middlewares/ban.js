const { validateServiceBanRecord } = require("../modules/ban");
const serviceMapper = new Map([
  ["/rooms/create", "service"],
  ["/rooms/join", "service"],
]);

const banMiddleware = async (req, res, next) => {
  const banErrorMessage = await validateServiceBanRecord(
    req,
    serviceMapper.get(req.originalUrl)
  );
  if (banErrorMessage !== undefined) {
    return res.status(400).json({ error: banErrorMessage });
  }
  next();
};

module.exports = banMiddleware;
