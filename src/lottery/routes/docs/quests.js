const { eventConfig } = require("../../../../loadenv");
const apiPrefix = `/events/${eventConfig.mode}/quests`;

const eventsDocs = {};
eventsDocs[`${apiPrefix}/instagram/share-event`] = {
  post: {
    tags: [`${apiPrefix}`],
    summary: "eventSharingOnInstagram 퀘스트 완료 요청",
    description: "eventSharingOnInstagram 퀘스트의 완료를 요청합니다.",
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
                  description: "성공 여부. 항상 true입니다.",
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
    summary: "purchaseSharingOnInstagram 퀘스트 완료 요청",
    description: "purchaseSharingOnInstagram 퀘스트의 완료를 요청합니다.",
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
