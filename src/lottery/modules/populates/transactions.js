const transactionPopulateOption = [
  { path: "event" },
  {
    path: "item",
    select: "name imageUrl price description isDisabled stock itemType",
  },
];

module.exports = {
  transactionPopulateOption,
};
