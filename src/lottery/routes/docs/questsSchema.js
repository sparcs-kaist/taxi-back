const questsSchema = {
  completeHandler: {
    type: "object",
    required: ["questId"],
    properties: {
      questId: {
        type: "string",
        enum: ["roomSharing"],
      },
    },
  },
};

module.exports = questsSchema;
