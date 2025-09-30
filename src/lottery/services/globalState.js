const { eventStatusModel } = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const logger = require("@/modules/logger").default;
const { isLogin, getLoginInfo } = require("../../modules/auths/login");
const { nodeEnv } = require("@/loadenv");

const { eventConfig } = require("@/loadenv");
const contracts = require("../modules/contracts");
const quests = Object.values(contracts.quests);

// 아래의 함수는 2025 봄 이벤트에서 사용되지 않습니다.
//
// // 유저가 이벤트에 참여할 수 있는지 확인하는 함수입니다.
// const checkIsUserEligible = (user) => {
//   // production 환경이 아닌 경우 테스트를 위해 참여 조건을 확인하지 않습니다.
//   if (nodeEnv !== "production") return true;

//   const kaistId = parseInt(user?.subinfo?.kaist || "0");
//   return 20240001 <= kaistId && kaistId <= 20241500;
// };

const getUserGlobalStateHandler = async (req, res) => {
  try {
    const userId = isLogin(req) ? getLoginInfo(req).oid : null;
    const eventStatus =
      userId &&
      (await eventStatusModel
        .findOne({ userId }, "completedQuests creditAmount isBanned")
        .lean());
    if (!eventStatus)
      return res.json({
        isAgreeOnTermsOfEvent: false,
        isBanned: false,
        creditAmount: 0,
        quests,
        completedQuests: [],
      });

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

const createUserGlobalStateHandler = async (req, res) => {
  try {
    let eventStatus = await eventStatusModel
      .findOne({ userId: req.userOid })
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
    const inviterStatus =
      req.body.inviter &&
      (await eventStatusModel.findById(req.body.inviter).lean());

    if (
      req.body.inviter &&
      (!inviterStatus ||
        inviterStatus.isBanned ||
        !inviterStatus.isInviteUrlEnabled)
    )
      return res.status(400).json({
        error: "GlobalState/create : invalid inviter",
      });

    const user = await userModel.findOne({ _id: req.userOid, withdraw: false });
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
      user.badge = true;
      user.phoneNumber = req.body.phoneNumber;
      await user.save();
    }

    // EventStatus Document를 생성합니다.
    eventStatus = new eventStatusModel({
      userId: req.userOid,
      creditAmount: eventConfig?.credit.initialAmount ?? 0,
      inviter: inviterStatus?.userId ?? undefined,
    });
    await eventStatus.save();

    // 퀘스트를 완료 처리합니다.
    // 해당 퀘스트는 2025 Fall Event에는 존재하지 않습니다.
    // 마찬가지로 EventSharingQuest는 2025 Fall Event에는 존재하지 않습니다.
    if (inviterStatus) {
      /*
      await contracts.completeEventSharingQuest(req.userOid, req.timestamp);
      await contracts.completeEventSharingQuest(
        inviterStatus.userId,
        req.timestamp
      );
      */
      await contracts?.completeReferralInviteeCredit?.(
        req.userOid,
        req.timestamp
      );
      await contracts?.completeReferralInviterCredit?.(
        inviterStatus.userId,
        req.timestamp
      );
      await contracts?.completePhoneVerificationQuest?.(
        req.userOid,
        req.timestamp
      );

      let currentInviter = inviterStatus;
      const ancestorIds = [];

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
          contracts.completeIndirectEventSharingQuest(ancestorId, req.timestamp)
        )
      );
    } else {
      await contracts?.completePhoneVerificationQuest?.(
        req.userOid,
        req.timestamp
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

module.exports = {
  getUserGlobalStateHandler,
  createUserGlobalStateHandler,
};
