import { Request, Response } from "express";
import { eventStatusModel } from "../modules/stores/mongo";
import { userModel } from "../../modules/stores/mongo";
import logger from "@/modules/logger";
import { isLogin, getLoginInfo } from "../../modules/auths/login";
import { nodeEnv, eventConfig } from "@/loadenv";
import {
  completeEventSharingQuest,
  completeFirstLoginQuest,
  completeIndirectEventSharingQuest,
  quests,
} from "../modules/contracts";

import type { EventStatus } from "../types";
import { User } from "@/types/mongo";
import type { Types } from "mongoose";
// 아래의 함수는 2025 봄 이벤트에서 사용되지 않습니다.
//
// // 유저가 이벤트에 참여할 수 있는지 확인하는 함수입니다.
// const checkIsUserEligible = (user) => {
//   // production 환경이 아닌 경우 테스트를 위해 참여 조건을 확인하지 않습니다.
//   if (nodeEnv !== "production") return true;

//   const kaistId = parseInt(user?.subinfo?.kaist || "0");
//   return 20240001 <= kaistId && kaistId <= 20241500;
// };

export const getUserGlobalStateHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = isLogin(req) ? getLoginInfo(req).oid : null;
    const eventStatus: EventStatus | null = userId
      ? await eventStatusModel
          .findOne({ userId }, "completedQuests creditAmount isBanned")
          .lean()
      : null;

    if (!eventStatus) {
      return res.json({
        isAgreeOnTermsOfEvent: false,
        isBanned: false,
        creditAmount: 0,
        quests,
        completedQuests: [],
      });
    }

    return res.json({
      ...eventStatus,
      isAgreeOnTermsOfEvent: true,
      quests,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "GlobalState/ : internal server error" });
  }
};

// group이 eventStatus.group과 같은 사용자들의 creditAmount를 합산합니다.
// const groupCreditAmount = await eventStatusModel.aggregate([
//   {
//     $match: {
//       group: eventStatus.group,
//     },
//   },
//   {
//     $group: {
//       _id: null,
//       creditAmount: { $sum: "$creditAmount" },
//     },
//   },
// ]);
// const groupCreditAmountReal = groupCreditAmount?.[0].creditAmount;
// if (!groupCreditAmountReal && groupCreditAmountReal !== 0)
//   return res
//     .status(500)
//     .json({ error: "GlobalState/ : internal server error" });

export const createUserGlobalStateHandler = async (
  req: Request,
  res: Response
) => {
  try {
    let userOid = req.userOid as string;
    let timestamp = req.timestamp as number;

    let eventStatus = await eventStatusModel
      .findOne({ userId: userOid })
      .lean();
    if (eventStatus)
      return res
        .status(400)
        .json({ error: "GlobalState/create : already created" });

    /* Request의 inviter 필드가 설정되어 있는데,
       1. 해당되는 유저가 이벤트에 참여하지 않았거나,
       2. 해당되는 유저의 이벤트 참여가 제한된 상태이거나,
       3. 해당되는 유저의 초대 링크가 활성화되지 않았으면,
       에러를 발생시킵니다. 개인정보 보호를 위해 오류 메세지는 하나로 통일하였습니다. */
    const inviterStatus: EventStatus | null = req.body.inviter
      ? await eventStatusModel.findById(req.body.inviter).lean()
      : null;

    if (
      req.body.inviter &&
      (!inviterStatus ||
        inviterStatus.isBanned ||
        !inviterStatus.isInviteUrlEnabled)
    )
      return res.status(400).json({
        error: "GlobalState/create : invalid inviter",
      });

    const user: User | null = await userModel.findOne({
      _id: userOid,
      withdraw: false,
    });
    if (!user)
      return res
        .status(500)
        .json({ error: "GlobalState/create : internal server error" });

    // 유저가 이벤트에 참여할 수 있는지 확인합니다.
    // const isEligible = checkIsUserEligible(user);
    // if (!isEligible)
    //   return res.status(400).json({
    //     error: "GlobalState/create : not eligible to participate in the event",
    //   });

    // 필요한 경우 유저의 전화번호를 업데이트합니다.
    if (user.phoneNumber !== req.body.phoneNumber) {
      if (user.phoneNumber) {
        logger.info(`Past user phone number: ${user.phoneNumber}`);
        logger.info(`Update user phone number: ${req.body.phoneNumber}`);
      }

      user.phoneNumber = req.body.phoneNumber;
      await user.save();
    }

    // EventStatus Document를 생성합니다.
    let neweventStatus = new eventStatusModel({
      userId: userOid,
      creditAmount: eventConfig?.credit.initialAmount ?? 0,
      inviter: inviterStatus?.userId ?? undefined,
    });
    await neweventStatus.save();

    // 퀘스트를 완료 처리합니다.
    await completeFirstLoginQuest(userOid, timestamp);

    if (inviterStatus) {
      await completeEventSharingQuest(userOid, timestamp);
      await completeEventSharingQuest(inviterStatus.userId, timestamp);
      let currentInviter = inviterStatus;
      const ancestorIds: Types.ObjectId[] = [];

      while (currentInviter?.inviter) {
        const higherInviter = await eventStatusModel
          .findOne({ userId: currentInviter.inviter })
          .lean();
        if (!higherInviter) break;

        ancestorIds.push(higherInviter.userId);
        currentInviter = higherInviter;
      }
      await Promise.all(
        ancestorIds.map((ancestorId) =>
          completeIndirectEventSharingQuest(ancestorId, timestamp)
        )
      );
    }

    return res.json({ result: true });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "GlobalState/create : internal server error" });
  }
};
