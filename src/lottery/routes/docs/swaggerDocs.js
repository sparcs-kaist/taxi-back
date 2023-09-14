const { eventMode } = require("../../../../loadenv");
const globalStateDocs = require("./globalState");
const itemsDocs = require("./items");
const transactionsDocs = require("./transactions");
const eventsDocs = require("./events");

const apiPrefix = `/events/${eventMode}`;

const eventSwaggerDocs = {
  tags: [
    {
      name: `${apiPrefix}/global-state`,
      description: "이벤트 - Global State 관련 API",
    },
    {
      name: `${apiPrefix}/items`,
      description: "이벤트 - 아이템 관련 API",
    },
    {
      name: `${apiPrefix}/transactions`,
      description: "이벤트 - 입출금 내역 관련 API",
    },
    {
      name: `${apiPrefix}/instagram`,
      description: "이벤트 - 인스타그램 이벤트 관련 API",
    },
  ],
  paths: {
    ...globalStateDocs,
    ...itemsDocs,
    ...transactionsDocs,
    ...eventsDocs,
  },
  components: {
    schemas: {},
  },
};

module.exports = eventSwaggerDocs;
