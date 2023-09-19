const { eventConfig } = require("../../../../loadenv");
const globalStateDocs = require("./globalState");
const itemsDocs = require("./items");
const transactionsDocs = require("./transactions");
const questsDocs = require("./quests");
const itemsSchema = require("./itemsSchema");
const publicNoticeDocs = require("./publicNotice");

const apiPrefix = `/events/${eventConfig.mode}`;

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
      name: `${apiPrefix}/quests`,
      description: "이벤트 - 퀘스트 관련 API",
    },
    {
      name: `${apiPrefix}/public-notice`,
      description: "이벤트 - 아이템 구매, 뽑기, 획득 공지 관련 API",
    },
  ],
  paths: {
    ...globalStateDocs,
    ...itemsDocs,
    ...transactionsDocs,
    ...questsDocs,
    ...publicNoticeDocs,
  },
  components: {
    schemas: {
      ...itemsSchema,
    },
  },
};

module.exports = eventSwaggerDocs;
