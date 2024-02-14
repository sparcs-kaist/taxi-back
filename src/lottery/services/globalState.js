const { eventStatusModel } = require("../modules/stores/mongo");
const { userModel } = require("../../modules/stores/mongo");
const logger = require("../../modules/logger");
const { isLogin, getLoginInfo } = require("../../modules/auths/login");

const contracts = require("../modules/contracts");
const quests = Object.values(contracts.quests);

const getUserGlobalStateHandler = async (req, res) => {
  try {
    const userId = isLogin(req) ? getLoginInfo(req).oid : null;
    const eventStatus =
      userId &&
      (await eventStatusModel
        .findOne({ userId }, "completedQuests creditAmount isBanned group")
        .lean());
    if (!eventStatus)
      return res.json({
        isAgreeOnTermsOfEvent: false,
        completedQuests: [],
        creditAmount: 0,
        group: 0,
        groupCreditAmount: 0,
        quests,
      });

    // group이 eventStatus.group과 같은 사용자들의 creditAmount를 합산합니다.
    const groupCreditAmount = await eventStatusModel.aggregate([
      {
        $match: {
          group: eventStatus.group,
        },
      },
      {
        $group: {
          _id: null,
          creditAmount: { $sum: "$creditAmount" },
        },
      },
    ]);
    const groupCreditAmountReal = groupCreditAmount[0]?.creditAmount;
    if (!groupCreditAmountReal && groupCreditAmountReal !== 0)
      return res
        .status(500)
        .json({ error: "GlobalState/ : internal server error" });

    return res.json({
      isAgreeOnTermsOfEvent: true,
      ...eventStatus,
      groupCreditAmount: groupCreditAmountReal,
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

    const user = await userModel.findOne({ _id: req.userOid });
    if (!user)
      return res
        .status(500)
        .json({ error: "GlobalState/Create : internal server error" });

    // 24학번 학사 과정 학생이 아닌 경우 이벤트에 참여할 수 없습니다.
    const kaistId = parseInt(user.subinfo?.kaist || "0");
    if (!(20240001 <= kaistId && kaistId <= 20241500)) {
      return res.status(400).json({
        error: "GlobalState/Create : not an undergraduate freshman",
      });
    }

    // 수집한 전화번호를 User Document에 저장합니다.
    // 다른 이벤트 참여 과정에서 문제가 생길 수 있으므로, 이벤트 참여 자격이 있는 경우에만 저장합니다.
    user.phoneNumber = req.body.phoneNumber;
    await user.save();

    // EventStatus Document를 생성합니다.
    eventStatus = new eventStatusModel({
      userId: req.userOid,
      creditAmount: contracts.creditInfo.initialAmount,
      group: req.body.group,
      inviter: req.body.inviter,
    });
    await eventStatus.save();

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
