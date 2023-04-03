const errorsDocs = {
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
};

module.exports = errorsDocs;
