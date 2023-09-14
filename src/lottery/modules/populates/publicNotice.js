const publicNoticePopulateOption = [
  { path: "event" },
  {
    path: "item",
    select: "name imageUrl price description isDisabled stock itemType",
  },
  {
    path: "",
  },
];

module.exports = {
  publicNoticePopulateOption,
};
