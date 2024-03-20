const { eventConfig } = require("../../../../loadenv");
const apiPrefix = `/events/${eventConfig?.mode}/quests`;

const questsDocs = {};
questsDocs[`${apiPrefix}/complete/:questId`] = {
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
      400: {
        description:
          "checkBanned에서 이벤트에 동의하지 않은 사람과 제재 대상을 선별합니다.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["error"],
              properties: {
                error: {
                  type: "string",
                  description: "",
                  example: "checkBanned: banned user",
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = questsDocs;
