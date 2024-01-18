const tag = "hc";
const apiPrefix = "/hc";

const hcDocs = {};
hcDocs[`${apiPrefix}`] = {
  get: {
    tags: [tag],
    summary: "서버 상태 확인",
    description: "서버 상태 확인",
    responses: {
      200: {
        description: "서버 상태 확인",
        content: {
          "application/json": {
            schema: {
              type: "string",
              example: "OK",
            },
          },
        },
      },
    },
  },
};

module.exports = hcDocs;
