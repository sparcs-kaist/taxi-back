const publicNoticePopulateOption = [
  {
    path: "userId",
    select: "id",
  },
  {
    path: "item",
    select: "name price description itemType",
  },
];

module.exports = {
  publicNoticePopulateOption,
};
