const { objectIdPattern, roomsPattern } = require("./utils");

const participantSchema = {
  part: {
    type: "object",
    required: ["user", "settlementStatus", "readAt"],
    properties: {
      user: {
        type: "string",
        pattern: objectIdPattern,
      },
      settlementStatus: {
        type: "string",
        enum: ["not-departed", "paid", "send-required", "sent"],
        default: "not-departed",
      },
      readAt: {
        type: "string",
        format: "date-time",
      },
    },
  },
};

const roomsSchema = {
  room: {
    type: "object",
    required: [
      "name",
      "from",
      "to",
      "time",
      "madeat",
      "settlementTotal",
      "maxPartLength",
    ],
    properties: {
      name: {
        type: "string",
        pattern: objectIdPattern,
      },
      from: {
        type: "string",
        pattern: objectIdPattern,
      },
      to: {
        type: "string",
        pattern: objectIdPattern,
      },
      time: {
        type: "string",
        format: "date-time",
      },
      part: {
        type: "array",
        items: participantSchema["part"],
      },
      madeat: {
        type: "string",
        format: "date-time",
      },
      settlementTotal: {
        type: "integer",
        default: 0,
      },
      maxPartLength: {
        type: "integer",
        default: 4,
      },
    },
  },
};

module.exports = { roomsSchema, participantSchema };
