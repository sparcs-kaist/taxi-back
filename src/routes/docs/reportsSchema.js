const reportsSchema = {
  createHandler: {
    type: "object",
    required: ["reportedId", "type", "time"],
    properties: {
      reportedId: {
        type: "string",
        pattern: "^[a-fA-F\\d]{24}$",
        required: true,
      },
      type: {
        type: "string",
        enum: ["no-settlement", "no-show", "etc-reason"],
        required: true,
      },
      etcDetail: {
        type: "string",
        maxLength: 30,
        default: "",
      },
      time: {
        type: "string",
        format: "date-time",
        required: true,
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
