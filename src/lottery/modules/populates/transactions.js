const transactionPopulateOption = [
  {
    path: "item",
    select: "-isRandomItem -randomWeight",
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
