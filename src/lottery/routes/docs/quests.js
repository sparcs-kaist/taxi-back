const { eventConfig } = require("../../../../loadenv");
const apiPrefix = `/events/${eventConfig.mode}/quests`;

const eventsDocs = {};
eventsDocs[`${apiPrefix}/complete/:questId`] = {
  post: {
    tags: [`${apiPrefix}`],
    summary: "퀘스트 완료 요청",
    description: "퀘스트의 완료를 요청합니다.",
    requestBody: {
      description: "",
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/completeHandler",
          },
        },
      },
    },
    responses: {
      200: {
        description: "",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["result"],
              properties: {
                result: {
                  type: "boolean",
                  description: "성공 여부",
                  example: true,
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = eventsDocs;
