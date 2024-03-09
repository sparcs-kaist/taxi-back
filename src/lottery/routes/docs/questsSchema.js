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
    errorMessage: "validation: bad request",
  },
};

module.exports = questsSchema;
