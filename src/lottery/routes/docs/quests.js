const { eventMode } = require("../../../../loadenv");
const apiPrefix = `/events/${eventMode}/quests`;

const eventsDocs = {};
eventsDocs[`${apiPrefix}/instagram/share-event`] = {
  post: {
    tags: [`${apiPrefix}`],
    summary: "이벤트 공유시 보상 반환",
    description: "인스타그램 스토리에 이벤트를 공유하면 보상 반환",
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
                  description: "성공 여부. 항상 true입니다.",
                  type: "boolean",
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

eventsDocs[`${apiPrefix}/instagram/share-purchase`] = {
  post: {
    tags: [`${apiPrefix}`],
    summary: "이벤트 공유시 보상 반환",
    description: "인스타그램 스토리에 구매내역을 공유하면 보상 반환",
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
                  description: "성공 여부. 항상 true입니다.",
                  type: "boolean",
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
