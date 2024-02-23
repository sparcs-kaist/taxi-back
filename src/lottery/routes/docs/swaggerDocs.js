const globalStateDocs = require("./globalState");
const inviteDocs = require("./invite");
const itemsDocs = require("./items");
const publicNoticeDocs = require("./publicNotice");
const questsDocs = require("./quests");
const transactionsDocs = require("./transactions");

const globalStateSchema = require("./globalStateSchema");
const inviteSchema = require("./inviteSchema");
const itemsSchema = require("./itemsSchema");
const questsSchema = require("./questsSchema");

const { eventConfig } = require("../../../../loadenv");
const apiPrefix = `/events/${eventConfig?.mode}`;

const eventSwaggerDocs = {
  tags: [
    {
      name: `${apiPrefix}/globalState`,
      description: "이벤트 - Global State 관련 API",
    },
    {
      name: `${apiPrefix}/invite`,
      description: "이벤트 - 초대 링크 관련 API",
    },
    // 이 태그는 2024 봄학기 이벤트에서 사용되지 않습니다.
    //
    // {
    //   name: `${apiPrefix}/items`,
    //   description: "이벤트 - 아이템 관련 API",
    // },
    {
      name: `${apiPrefix}/publicNotice`,
      description: "이벤트 - 아이템 구매, 뽑기, 획득 공지 관련 API",
    },
    {
      name: `${apiPrefix}/quests`,
      description: "이벤트 - 퀘스트 관련 API",
    },
    {
      name: `${apiPrefix}/transactions`,
      description: "이벤트 - 입출금 내역 관련 API",
    },
  ],
  paths: {
    ...globalStateDocs,
    ...inviteDocs,
    //...itemsDocs,
    ...publicNoticeDocs,
    ...questsDocs,
    ...transactionsDocs,
  },
  components: {
    schemas: {
      ...globalStateSchema,
      ...inviteSchema,
      //...itemsSchema,
      ...questsSchema,
    },
  },
};

module.exports = eventSwaggerDocs;
