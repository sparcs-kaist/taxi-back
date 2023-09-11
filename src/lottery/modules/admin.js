const { useUserCreditAmount } = require("./credit");
const { transactionModel } = require("./stores/mongo");
const { recordAction } = require("../../modules/adminResource");
const { eventEnv } = require("../../../loadenv");

/** eventId가 없는 경우 null이 아닌 undefined를 넣어야 합니다. */
const creditTransfer = async (userId, amount, eventId, comment) => {
  const user = await useUserCreditAmount(userId);
  await user.creditUpdate(amount);

  const transaction = new transactionModel({
    type: "get",
    amount,
    userId,
    eventId,
    comment,
  });
  await transaction.save();

  return transaction._id;
};

/** itemId가 없는 경우 null이 아닌 undefined를 넣어야 합니다. */
const creditWithdraw = async (userId, amount, itemId, comment) => {
  const user = await useUserCreditAmount(userId);
  await user.creditUpdate(-amount);

  const transaction = new transactionModel({
    type: "use",
    amount,
    userId,
    itemId,
    comment,
  });
  await transaction.save();

  return transaction._id;
};

const instagramRewardActionHandler = async (req, res, context) => {
  const transactionId = await creditTransfer(
    context?.record?.params?.userId,
    eventEnv.instagramReward,
    eventEnv.instagramEventId,
    eventEnv.instagramComment
  );

  let record = context.record.toJSON(context.currentAdmin);
  record.params.creditAmount += eventEnv.instagramReward;

  return {
    record,
    transactionId,
  };
};
const instagramRewardActionLogs = [
  "update",
  {
    action: "create",
    target: (res, req, context) => `Transaction(_id = ${res.transactionId})`,
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
