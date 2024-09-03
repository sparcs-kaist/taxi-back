const transactionPopulateOption = [
  {
    path: "itemId",
    select: "name imageUrl",
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
