const { eventStatusModel } = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const logger = require("../../modules/logger");

const { eventConfig } = require("../../../loadenv");

const searchInviterHandler = async (req, res) => {
  try {
    const { inviter } = req.params;
    const inviterStatus = await eventStatusModel.findOne({ _id: inviter });
    if (
      !inviterStatus ||
      !inviterStatus.isEnabledInviteUrl ||
      inviterStatus.isBanned
    )
      return res.status(400).json({ error: "Invite/Search : invalid inviter" });

    const inviterInfo = await userModel.findOne({
      _id: inviterStatus.userId,
      withdraw: false,
    });
    if (!inviterInfo)
      return res
        .status(500)
        .json({ error: "Invite/Search : internal server error" });

    return res.json({
      nickname: inviterInfo.nickname,
      profileImageUrl: inviterInfo.profileImageUrl,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Invite/Search : internal server error" });
  }
};

const createInviteUrlHandler = async (req, res) => {
  try {
    const inviteUrl = `${req.origin}/event/${eventConfig?.mode}-invite/${req.eventStatus._id}`;

    if (req.eventStatus.isEnabledInviteUrl) return res.json({ inviteUrl });

    const eventStatus = await eventStatusModel
      .findOneAndUpdate(
        {
          _id: req.eventStatus._id,
          isEnabledInviteUrl: false,
        },
        {
          isEnabledInviteUrl: true,
        }
      )
      .lean();
    if (!eventStatus)
      return res
        .status(500)
        .json({ error: "Invite/Create : internal server error" });

    return res.json({ inviteUrl });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Invite/Create : internal server error" });
  }
};

module.exports = {
  searchInviterHandler,
  createInviteUrlHandler,
};
