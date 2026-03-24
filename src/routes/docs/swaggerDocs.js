const { reportsSchema } = require("./schemas/reportsSchema");
const { roomsSchema } = require("./schemas/roomsSchema");
const { fareSchema } = require("./schemas/fareSchema");
const { chatsSchema } = require("./schemas/chatsSchema");
const { emailsSchema } = require("./schemas/emailsSchema");
const { statisticsSchema } = require("./schemas/statisticsSchema");
const reportsDocs = require("./reports");
const logininfoDocs = require("./logininfo");
const locationsDocs = require("./locations");
const authDocs = require("./auth");
const authReplaceDocs = require("./auth.replace");
const usersDocs = require("./users");
const roomsDocs = require("./rooms");
const chatsDocs = require("./chats");
const fareDocs = require("./fare");
const noticeDocs = require("./notice").default;
const emailsDocs = require("./emails").default;
const statisticsDocs = require("./statistics").default;
const { port, nodeEnv } = require("@/loadenv");

const serverList = [
  {
    url: `http://localhost:${port}`,
    description: "local api server",
    development: true,
    production: false,
  },
  {
    url: "https://taxi.sparcs.org/api",
    description: "taxi main api server",
    development: true,
    production: true,
  },
  {
    url: "https://taxi.dev.sparcs.org/api",
    description: "taxi dev api server",
    development: true,
    production: false,
  },
];

const swaggerDocs = {
  openapi: "3.0.3",
  info: {
    title: "Taxi API Document",
    version: "1.0.0",
  },
  basePath: "/",
  servers: serverList.filter((server) => server[nodeEnv]),
  tags: [
    {
      name: "locations",
      description: "출발지/도착지 정보 제공",
    },
    {
      name: "logininfo",
      description: "로그인 정보 제공",
    },
    {
      name: "reports",
      description: "사용자 신고 및 신고 기록 조회",
    },
    {
      name: "auth",
      description: "사용자 생성, 로그인, 로그아웃 등 사용자 상태 관리 지원",
    },
    {
      name: "users",
      description: "유저 계정 정보 수정 및 조회",
    },
    {
      name: "rooms",
      description: "방 생성/수정/삭제/조회 및 관리 지원",
    },
    {
      name: "chats",
      description: "채팅 시 발생하는 이벤트 정리",
    },
    {
      name: "fare",
      description: "예상 택시 금액 계산",
    },
    {
      name: "notice",
      description: "공지사항 조회",
    },
    {
      name: "emails",
      description: "이메일 관련 기능 (트래킹 등)",
    },
    {
      name: "statistics",
      description: "통계 페이지",
    },
  ],
  consumes: ["application/json"],
  produces: ["application/json"],
  paths: {
    ...reportsDocs,
    ...logininfoDocs,
    ...locationsDocs,
    ...usersDocs,
    ...authDocs,
    ...authReplaceDocs,
    ...chatsDocs,
    ...roomsDocs,
    ...fareDocs,
    ...noticeDocs,
    ...emailsDocs,
    ...statisticsDocs,
  },
  components: {
    schemas: {
      ...reportsSchema,
      ...roomsSchema,
      ...fareSchema,
      ...chatsSchema,
      ...emailsSchema,
      ...statisticsSchema,
    },
  },
};

module.exports = swaggerDocs;
