const inviteSchema = {
  searchInviterHandler: {
    type: "object",
    required: ["inviter"],
    properties: {
      inviter: {
        type: "string",
        pattern: "^[a-fA-F\\d]{24}$",
      },
    },
    errorMessage: "validation: bad request",
  },
};

module.exports = inviteSchema;
