const { eventMode } = require("../../../../loadenv");
const apiPrefix = `/events/${eventMode}/instagram`;

const eventsDocs = {};
eventsDocs[`${apiPrefix}/share-event`] = {
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
              type: "boolean",
              example: { result: true },
            },
          },
        },
      },
      500: { error: "Events/Insagram/Share-Event" },
    },
  },
};

eventsDocs[`${apiPrefix}/share-purchase`] = {
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
              type: "boolean",
              example: { result: true },
            },
          },
        },
      },
      500: { error: "Events/Insagram/Share-Purchase" },
    },
  },
};

module.exports = eventsDocs;
