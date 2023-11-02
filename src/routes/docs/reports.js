const tag = "reports";
const apiPrefix = "/reports";

const reportsDocs = {};
reportsDocs[`${apiPrefix}/create`] = {
  post: {
    tags: [tag],
    summary: "신고 작성",
    description: "주어진 유저를 전달된 사유로 신고함",
    requestBody: {
      description: "Update an existent user in the store",
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/createHandler",
          },
        },
      },
    },
    responses: {
      200: {
        description: "report successful",
        content: {
          "text/plain": {
            schema: {
              type: "string",
              example: "report successful",
            },
          },
        },
      },
    },
  },
};

reportsDocs[`${apiPrefix}/searchByUser`] = {
  get: {
    tags: [tag],
    summary: "신고 내역 반환",
    description:
      "로그인된 사용자의 신고한 내역과, 신고받은 내역을 반환한다 <br/>1000개의 limit이 있다.",
    responses: {
      200: {
        description: "신고된 내역과 신고 받은 내역",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                reporting: {
                  type: "array",
                },
                reported: {
                  type: "array",
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = reportsDocs;
