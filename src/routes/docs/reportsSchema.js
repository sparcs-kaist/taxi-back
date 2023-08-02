const reportsSchema = {
  createHandler: {
    type: "object",
    required: ["reportedId", "type", "time", "roomId"],
    properties: {
      reportedId: {
        type: "string",
        pattern: "^[a-fA-F\\d]{24}$",
      },
      type: {
        type: "string",
        enum: ["no-settlement", "no-show", "etc-reason"],
      },
      etcDetail: {
        type: "string",
        maxLength: 30,
        default: "",
      },
      time: {
        type: "string",
        format: "date-time",
      },
      roomId: {
        type: "string",
        pattern: "^[a-fA-F\\d]{24}$",
      },
    },
    errorMessage: "validation: bad request",
  },
};

module.exports = reportsSchema;
