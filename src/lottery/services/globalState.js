const { eventStatusModel } = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const logger = require("../../modules/logger");
const { isLogin, getLoginInfo } = require("../../modules/auths/login");

const { eventConfig } = require("../../../loadenv");
const contracts =
  eventConfig && require(`../modules/contracts/${eventConfig.mode}`);
const quests = contracts ? Object.values(contracts.quests) : undefined;

const getUserGlobalStateHandler = async (req, res) => {
  try {
    const userId = isLogin(req) ? getLoginInfo(req).oid : null;
    const eventStatus =
      userId &&
      (await eventStatusModel
        .findOne({ userId }, "completedQuests creditAmount isBanned group")
        .lean());
    if (eventStatus)
      return res.json({
        isAgreeOnTermsOfEvent: true,
        ...eventStatus,
        quests,
      });
    else
      return res.json({
        isAgreeOnTermsOfEvent: false,
        completedQuests: [],
        creditAmount: 0,
        group: 0,
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
        .json({ error: "GlobalState/Create : already created" });

    if (
      req.body.inviter &&
      (await eventStatusModel.findOne({ _id: req.body.inviter }).lean())
    )
      return res.status(400).json({
        error: "GlobalState/Create : inviter did not participate in the event",
      });

    eventStatus = new eventStatusModel({
      userId: req.userOid,
      creditAmount: eventConfig?.initialCreditAmount ?? 0,
      group: req.body.group,
      inviter: req.body.inviter,
    });
    await eventStatus.save();

    //logic2. 수집한 유저 전화번호 user Scheme 에 저장
    const user = await userModel.findOne({ _id: req.userOid });
    user.phoneNumber = req.body.phoneNumber;
    await user.save();

    await contracts.completeFirstLoginQuest(req.userOid, req.timestamp);

    res.json({ result: true });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "GlobalState/Create : internal server error" });
  }
};

module.exports = {
  getUserGlobalStateHandler,
  createUserGlobalStateHandler,
};
