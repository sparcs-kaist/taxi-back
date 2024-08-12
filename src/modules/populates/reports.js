const reportPopulateOption = [
  {
    path: "reportedId",
    select: "_id id name nickname profileImageUrl",
    match: { withdraw: false },
  },
];

module.exports = {
  reportPopulateOption,
};
