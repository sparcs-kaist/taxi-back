const logger = require("./logger");
const { banModel } = require("./stores/mongo");

/**
 *
 * @param {*} req
 * @param {String} service
 */
const validateServiceBanRecord = async (req, service) => {
  switch (service) {
    case "Rooms/create":
    case "Rooms/join":
      var _serviceName = "service";
      break;
    default:
      logger.error(
        "Error occured while validateServiceBanRecord: given service is not defined."
      );
      return;
  }
  try {
    // 현재 시각이 expireAt 보다 작고, 본인인 경우(ban의 userId가 userId랑 같은 경우) 중 serviceName이 "service"인 record를 모두 가져옴
    const bans = await banModel.find({
      userSid: req.session.loginInfo.sid,
      expireAt: {
        $gte: req.timestamp,
      },
      serviceName: _serviceName,
    });
    var banRecord = undefined;
    if (bans.length > 0) {
      // 가장 expireAt이 큰 정지 기록만 반환함.
      var banRecord = bans.reduce(
        (max, ban) => (ban.expireAt > max.expireAt ? ban : max),
        bans[0]
      );
    }
  } catch (err) {
    logger.error(
      "Error occured while getValidServiceBanRecord: " + err.message
    );
    return;
  }
  if (banRecord != undefined) {
    const formattedExpireAt = banRecord.expireAt
      .toISOString()
      .replace("T", " ")
      .split(".")[0];
    switch (service) {
      case "Rooms/create":
        var banErrorMessage = `Rooms/create : user ${req.userId} (${req.session.loginInfo.sid}) is temporarily restricted from creating rooms until ${formattedExpireAt}.`;
        break;
      case "Rooms/join":
        var banErrorMessage = `Rooms/join : user ${req.userId} (${req.session.loginInfo.sid}) is temporarily restricted from joining rooms until ${formattedExpireAt}.`;
        break;
    }
    return banErrorMessage;
  }
  return;
};

module.exports = {
  validateServiceBanRecord,
};
