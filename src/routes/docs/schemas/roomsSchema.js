const { objectIdPattern, roomsPattern } = require("../utils");

const participantSchema = {
  part: {
    type: "object",
    required: ["_id", "name", "nickname", "profileImageUrl", "readAt"],
    properties: {
      _id: {
        type: "string",
        pattern: objectIdPattern,
      },
      name: {
        type: "string",
      },
      nickname: {
        type: "string",
      },
      profileImageUrl: {
        type: "string",
      },
      isSettlement: {
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
      "part",
      "madeat",
      "maxPartLength",
      "isDeparted",
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
      maxPartLength: {
        type: "integer",
        default: 4,
      },
      settlementTotal: {
        type: "integer",
        default: 0,
      },
      isOver: {
        type: "boolean",
      },
      isDeparted: {
        type: "boolean",
      },
    },
  },
};

module.exports = { roomsSchema, participantSchema };
