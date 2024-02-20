const { eventStatusModel } = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const logger = require("../../modules/logger");

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

    const inviterInfo = await userModel.findOne({ _id: inviterStatus.userId });
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
    // TODO
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Invite/Create : internal server error" });
  }
};

module.exports = {
  searchInviterHandler,
  createInviteUrlHandler,
};
