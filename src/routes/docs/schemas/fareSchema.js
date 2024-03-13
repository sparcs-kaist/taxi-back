const { objectIdPattern } = require("../utils");

const fareSchema = {
  getTaxiFare: {
    type: "object",
    required: ["from", "to", "time"],
    properties: {
      from: {
        type: "string",
        format: objectIdPattern,
      },
      to: {
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
