const { recordAction } = require("../../modules/adminResource");
const { eventEnv } = require("../../../loadenv");

const { eventHandler } = require("./events");

const instagramRewardActionHandler = async (req, res, context) => {
  const result = await eventHandler(
    context?.record?.params?.userId,
    eventEnv.instagramEventId
  );
  const record = context.record.toJSON(context.currentAdmin);

  if (result) {
    record.params.creditAmount += result.event.rewardAmount;

    return {
      record,
      notice: {
        message: "성공적으로 보상을 지급했습니다.",
      },
      response: {
        transactionId: result.transactionId,
      },
    };
  } else
    return {
      record,
      notice: {
        message: "보상을 지급하지 못했습니다. 이미 보상을 받은 유저입니다.",
        type: "error",
      },
    };
};
const instagramRewardActionLogs = [
  "update",
  {
    action: "create",
    target: (res, req, context) =>
      `Transaction(_id = ${res.response.transactionId})`,
  },
];

const instagramRewardAction = recordAction(
  "instagramReward",
  instagramRewardActionHandler,
  instagramRewardActionLogs
);

module.exports = {
  instagramRewardAction,
};
