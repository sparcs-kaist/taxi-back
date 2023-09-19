const globalStateSchema = {
  createUserGlobalStateHandler: {
    type: "object",
    required: ["phoneNumber"],
    properties: {
      phoneNumber: {
        type: "string",
        pattern: "^010-?([0-9]{3,4})-?([0-9]{4})$",
      },
    },
    errorMessage: "validation: bad request",
  },
};

module.exports = globalStateSchema;
