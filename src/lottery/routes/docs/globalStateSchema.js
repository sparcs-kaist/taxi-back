const globalStateSchema = {
  createUserGlobalStateHandler: {
    type: "object",
    required: ["phoneNumber", "group"],
    properties: {
      phoneNumber: {
        type: "string",
        pattern: "^010-?([0-9]{3,4})-?([0-9]{4})$",
      },
      group: {
        type: "integer",
        minimum: 1,
        maximum: 26,
      },
      inviter: {
        type: "string",
        pattern: "^[a-fA-F\\d]{24}$",
      },
    },
    errorMessage: "validation: bad request",
  },
};

module.exports = globalStateSchema;
