const transactionPopulateOption = [
  { path: "eventId" },
  {
    path: "itemId",
    select: "name imageUrl price description isDisabled stock itemType",
  },
];

module.exports = {
  transactionPopulateOption,
};
