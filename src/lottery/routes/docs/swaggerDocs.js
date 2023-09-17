const { eventMode } = require("../../../../loadenv");
const globalStateDocs = require("./globalState");
const itemsDocs = require("./items");
const transactionsDocs = require("./transactions");
const eventsSchema = require("./eventsSchema");
const itemsSchema = require("./itemsSchema");
const publicNoticeDocs = require("./publicNotice");

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
      name: `${apiPrefix}/public-notice`,
      description: "이벤트 - 공지사항 관련 API",
    },
  ],
  paths: {
    ...globalStateDocs,
    ...itemsDocs,
    ...transactionsDocs,
    ...publicNoticeDocs,
  },
  components: {
    schemas: {
      ...eventsSchema,
      ...itemsSchema,
    },
  },
};

module.exports = eventSwaggerDocs;
