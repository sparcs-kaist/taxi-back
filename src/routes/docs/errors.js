const errorsDocs = {
  400: {
    description: "invalid request",
    content: {
      "text/plain": {
        schema: {
          type: "string",
          example: "invalid request",
        },
      },
    },
  },
  401: {
    description: "invalid request",
    content: {
      "text/plain": {
        schema: {
          type: "string",
          example: "Invalid token",
        },
      },
    },
  },
  500: {
    description: "internal server error",
    content: {
      "text/plain": {
        schema: {
          type: "string",
          example: "internal server error",
        },
      },
    },
  },
  501: {
    description: "server error",
    content: {
      "text/plain": {
        schema: {
          type: "string",
          example: "server error",
        },
      },
    },
  },
};

module.exports = errorsDocs;
