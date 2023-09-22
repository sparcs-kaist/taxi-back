const questsSchema = {
  completeHandler: {
    type: "object",
    required: ["questId"],
    properties: {
      questId: {
        type: "string",
      },
    },
  },
};

module.exports = questsSchema;
