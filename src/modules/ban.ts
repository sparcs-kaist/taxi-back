import type { Request } from "express";
import logger from "@/modules/logger";
import { banModel } from "@/modules/stores/mongo";

export const validateServiceBanRecord = async (
  req: Request,
  service: string
) => {
  let banRecord = undefined;

  try {
    // 현재 시각이 expireAt 보다 작고, 본인인 경우(ban의 userId가 userId랑 같은 경우) 중 serviceName이 "service"인 record를 모두 가져옴
    const bans = await banModel
      .find({
        userSid: req.session.loginInfo!.sid,
        expireAt: {
          $gte: req.timestamp,
        },
        serviceName: service,
      })
      .sort({ expireAt: -1 });
    if (bans.length > 0) {
      // 가장 expireAt이 큰 정지 기록만 반환함.
      banRecord = bans[0];
    }
  } catch (err) {
    logger.error(err);
    return;
  }
  if (banRecord !== undefined) {
    const formattedExpireAt = banRecord.expireAt
      .toISOString()
      .replace("T", " ")
      .split(".")[0];
    const banErrorMessage = `${req.originalUrl} : user ${req.userOid} (${
      req.session.loginInfo!.sid
    }) is temporarily restricted from service until ${formattedExpireAt}.`;
    return banErrorMessage;
  }
  return;
};
