const { eventStatusModel } = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const logger = require("@/modules/logger").default;

const { eventConfig } = require("@/loadenv");

const searchInviterHandler = async (req, res) => {
  try {
    /* 1. 해당되는 유저가 이벤트에 참여하지 않았거나,
       2. 해당되는 유저의 이벤트 참여가 제한된 상태이거나,
       3. 해당되는 유저의 초대 링크가 활성화되지 않았으면,
       에러를 발생시킵니다. 개인정보 보호를 위해 오류 메세지는 하나로 통일하였습니다. */
    const inviterStatus = await eventStatusModel
      .findById(req.params.inviter)
      .lean();
    if (
      !inviterStatus ||
      inviterStatus.isBanned ||
      !inviterStatus.isInviteUrlEnabled
    )
      return res
        .status(400)
        .json({ error: "Invites/search : invalid inviter" });

    // 해당되는 유저의 닉네임과 프로필 이미지를 가져옵니다.
    const inviter = await userModel
      .findOne(
        { _id: inviterStatus.userId, withdraw: false },
        "nickname profileImageUrl"
      )
      .lean();
    if (!inviter)
      return res
        .status(500)
        .json({ error: "Invites/search : internal server error" });

    return res.json(inviter);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Invites/search : internal server error" });
  }
};

const createInviteUrlHandler = async (req, res) => {
  try {
    const inviteUrl = `${req.origin}/event/${eventConfig?.mode}-invite/${req.eventStatus._id}`;

    // 이미 초대 링크가 활성화된 경우 링크를 즉시 반환합니다.
    if (req.eventStatus.isInviteUrlEnabled) return res.json({ inviteUrl });

    // 초대 링크를 활성화합니다.
    const { modifiedCount } = await eventStatusModel.updateOne(
      {
        _id: req.eventStatus._id,
        isInviteUrlEnabled: false,
      },
      {
        isInviteUrlEnabled: true,
      }
    );
    if (modifiedCount !== 1)
      return res
        .status(500)
        .json({ error: "Invites/create : internal server error" });

    return res.json({ inviteUrl });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Invites/create : internal server error" });
  }
};

module.exports = {
  searchInviterHandler,
  createInviteUrlHandler,
};
