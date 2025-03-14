export const transactionPopulateOption = [
  {
    path: "itemId",
    select: "name imageUrl",
  },
];

export const publicNoticePopulateOption = [
  {
    path: "userId",
    select: "nickname",
  },
  {
    path: "item",
    select: "name price description",
  },
];
