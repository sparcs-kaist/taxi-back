const questsSchema = {
  completeHandler: {
    type: "object",
    required: ["questId"],
    properties: {
      questId: {
        type: "string",
        enum: [
          "roomSharing",
          "eventSharingOnInstagram",
          "purchaseSharingOnInstagram",
        ],
      },
    },
  },
};

module.exports = questsSchema;
