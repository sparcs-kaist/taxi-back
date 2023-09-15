const { eventStatusModel } = require("../modules/stores/mongo");

const useUserCreditAmount = async (userId) => {
  const eventStatus = await eventStatusModel.findOne({ userId }).lean();
  if (!eventStatus) return null;

  return {
    amount: eventStatus.creditAmount,
    update: async (delta) => {
      await eventStatusModel.updateOne(
        { _id: eventStatus._id },
        {
          $inc: {
            creditAmount: delta,
          },
        }
      );
    },
  };
};

module.exports = {
  useUserCreditAmount,
};
