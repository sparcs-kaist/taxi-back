const { eventConfig } = require("../../loadenv");
const { validateServiceBanRecord } = require("../modules/ban");

const serviceMapper = new Map([
  ["/rooms/create", "service"],
  ["/rooms/join", "service"],
]);

const banMiddleware = async (req, res, next) => {
  let service = serviceMapper.get(req.originalUrl);
  if (!service && !!eventConfig && req.originalUrl.includes(eventConfig.mode)) {
    service = eventConfig.mode;
  }
  const banErrorMessage = await validateServiceBanRecord(
    req.session.loginInfo.sid,
    req.timestamp,
    req.originalUrl,
    service
  );
  if (banErrorMessage !== undefined) {
    return res.status(400).json({ error: banErrorMessage });
  }
  next();
};

module.exports = banMiddleware;
