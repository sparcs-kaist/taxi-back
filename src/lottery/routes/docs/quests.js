const { eventConfig } = require("@/loadenv");
const apiPrefix = `/events/${eventConfig?.mode}/quests`;

const questsDocs = {};
questsDocs[`${apiPrefix}/complete/{questId}`] = {
  post: {
    tags: [`${apiPrefix}`],
    summary: "퀘스트 완료 요청",
    description: "퀘스트의 완료를 요청합니다.",
    parameters: [
      {
        in: "path",
        name: "questId",
        required: true,
        description: "완료를 요청할 퀘스트의 ID",
        example: "QUEST ID",
      },
    ],
    responses: {
      200: {
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

module.exports = questsDocs;
