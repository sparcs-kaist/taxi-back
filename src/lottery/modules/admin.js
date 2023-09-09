const { useUserCreditAmount } = require("./credit");
const { transactionModel } = require("./stores/mongo");

// eventId가 없는 경우 null이 아닌 undefined를 넣어야 합니다.
const creditTransfer = async (req, amount, eventId, comment) => {
  const user = await useUserCreditAmount(req);

  await user.creditUpdate(amount);

  const transaction = new transactionModel({
    type: "get",
    amount,
    userId: req.userOid,
    eventId,
    comment,
  });
  await transaction.save();
};

// itemId가 없는 경우 null이 아닌 undefined를 넣어야 합니다.
const creditWithdraw = async (req, amount, itemId, comment) => {
  const user = await useUserCreditAmount(req);

  await user.creditUpdate(-amount);

  const transaction = new transactionModel({
    type: "use",
    amount,
    userId: req.userOid,
    itemId,
    comment,
  });
  await transaction.save();
};

module.exports = {
  creditTransfer,
  creditWithdraw,
};
