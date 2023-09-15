const publicNoticePopulateOption = [
  { path: "event" },
  {
    path: "item",
    select: "name price description itemType",
  },
];

module.exports = {
  publicNoticePopulateOption,
};
