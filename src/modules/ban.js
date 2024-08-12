const logger = require("./logger");
const { banModel } = require("./stores/mongo");

const getMaxValidServiceBanRecord = async (req) => {
  try {
    // 현재 시각이 expireAt 보다 작고, 본인인 경우(ban의 userId가 userOid랑 같은 경우) 중 serviceName이 "service"인 record를 모두 가져옴
    const bans = await banModel.find({
      userId: req.userOid,
      expireAt: {
        $gte: req.timestamp,
      },
      "services.serviceName": "service",
    });
    if (bans.length > 0) {
      // 가장 expireAt이 큰 정지 기록만 반환함.
      const latestBan = bans.reduce(
        (max, ban) => (ban.expireAt > max.expireAt ? ban : max),
        bans[0]
      );
      return latestBan;
    }
    return;
  } catch (err) {
    logger.error(
      "Error occured while getValidServiceBanRecord: " + err.message
    );
    return;
  }
};

module.exports = {
  getMaxValidServiceBanRecord,
};
