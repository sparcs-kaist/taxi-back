const { eventStatusModel } = require("../modules/stores/mongo");

const useUserCreditAmount = async (req) => {
  const eventStatus = await eventStatusModel.findOne({ userId: req.userOid });
  if (!eventStatus) return null;

  return {
    creditAmount: eventStatus.creditAmount,
    creditUpdate: async (delta) => {
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
