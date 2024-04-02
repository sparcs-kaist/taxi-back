const { eventConfig } = require("../../../loadenv");
const eventPeriod = eventConfig && {
  startAt: new Date(eventConfig.period.startAt),
  endAt: new Date(eventConfig.period.endAt),
};

const timestampValidator = (req, res, next) => {
  if (
    !eventPeriod ||
    req.timestamp >= eventPeriod.endAt ||
    req.timestamp < eventPeriod.startAt
  ) {
    return res.status(400).json({ error: "out of date" });
  } else {
    next();
  }
};

module.exports = timestampValidator;
