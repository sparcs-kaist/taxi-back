const globalStateDocs = require("./globalState");
const invitesDocs = require("./invites");
const itemsDocs = require("./items");
const publicNoticeDocs = require("./publicNotice");
const questsDocs = require("./quests");
const transactionsDocs = require("./transactions");

const { globalStateSchema } = require("./schemas/globalStateSchema");
const { invitesSchema } = require("./schemas/invitesSchema");
const itemsSchema = require("./schemas/itemsSchema");
const { questsSchema } = require("./schemas/questsSchema");

const { eventConfig } = require("../../../../loadenv");
const apiPrefix = `/events/${eventConfig?.mode}`;

const eventSwaggerDocs = {
  tags: [
    {
      name: `${apiPrefix}/globalState`,
      description: "이벤트 - Global State 관련 API",
    },
    {
      name: `${apiPrefix}/invites`,
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
    ...invitesDocs,
    //...itemsDocs,
    ...publicNoticeDocs,
    ...questsDocs,
    ...transactionsDocs,
  },
  components: {
    schemas: {
      ...globalStateSchema,
      ...invitesSchema,
      //...itemsSchema,
      ...questsSchema,
    },
  },
};

module.exports = eventSwaggerDocs;
