const { eventMode } = require("../../../../loadenv");
const globalStateDocs = require("./globalState");
const itemsDocs = require("./items");
const transactionsDocs = require("./transactions");
<<<<<<< HEAD
const eventsDocs = require("./events");
=======
const itemsSchema = require("./itemsSchema");
>>>>>>> dev
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
<<<<<<< HEAD
      name: `${apiPrefix}/instagram`,
      description: "이벤트 - 인스타그램 이벤트 관련 API",
    },
    {
      name: `${apiPrefix}/public-notice`,
      description: "이벤트 - 아이템 구매, 뽑기, 획득 공지 관련 API",
=======
      name: `${apiPrefix}/public-notice`,
      description: "이벤트 - 공지사항 관련 API",
>>>>>>> dev
    },
  ],
  paths: {
    ...globalStateDocs,
    ...itemsDocs,
    ...transactionsDocs,
<<<<<<< HEAD
    ...eventsDocs,
=======
>>>>>>> dev
    ...publicNoticeDocs,
  },
  components: {
    schemas: {
      ...itemsSchema,
    },
  },
};

module.exports = eventSwaggerDocs;
