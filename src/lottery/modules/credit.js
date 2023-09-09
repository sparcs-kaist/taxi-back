const { eventStatusModel } = require("../modules/stores/mongo");

const getUserCreditAmount = async (req) => {
  const eventStatus = await eventStatusModel.findOne({ userId: req.userOid });
  if (!eventStatus) return null;

  return {
    creditAmount: eventStatus.creditAmount,
    creditUpdate: async (delta) => {
      eventStatus.creditAmount += delta;
      await eventStatus.save();
    },
  };
};

module.exports = {
  getUserCreditAmount,
};
