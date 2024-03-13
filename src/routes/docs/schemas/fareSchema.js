const { objectIdPattern } = require("../utils");

const fareSchema = {
  getTaxiFare: {
    type: "object",
    required: ["start", "goal", "time"],
    properties: {
      start: {
        type: "string",
        format: objectIdPattern,
      },
      goal: {
        type: "string",
        format: objectIdPattern,
      },
      time: {
        type: "string",
        format: "date-time",
      },
    },
    errorMessage: "validation: bad request",
  },
};
module.exports = fareSchema;
