const transactionPopulateOption = [
  {
    path: "item",
    select: "name imageUrl price description isDisabled stock itemType",
  },
];

const publicNoticePopulateOption = [
  {
    path: "userId",
    select: "nickname",
  },
  {
    path: "item",
    select: "name price description",
  },
];

module.exports = {
  transactionPopulateOption,
  publicNoticePopulateOption,
};
