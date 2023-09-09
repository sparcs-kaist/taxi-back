const { useUserCreditAmount } = require("./credit");
const { transactionModel } = require("./stores/mongo");
const { recordAction } = require("../../modules/adminResource");

// eventId가 없는 경우 null이 아닌 undefined를 넣어야 합니다.
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

// itemId가 없는 경우 null이 아닌 undefined를 넣어야 합니다.
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
    500 /*TODO: 송편개수*/,
    "64fc99136b599860bff4780f" /*TODO: 이벤트ID*/,
    "뿌슝빠슝" /*TODO: 코멘트*/
  );

  let record = context.record.toJSON(context.currentAdmin);
  record.params.creditAmount += 500; // 송편개수

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
