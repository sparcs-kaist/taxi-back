const reportsSchema = {
  createHandler: {
    type: "object",
    required: ["reportedId", "type", "time"],
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
      },
      time: {
        type: "string",
        format: "date-time",
      },
    },
    errorMessage: "validation: bad request",
  },
};

module.exports = reportsSchema;
