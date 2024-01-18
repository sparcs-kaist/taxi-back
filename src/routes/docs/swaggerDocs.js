const reportsSchema = require("./reportsSchema");
const reportsDocs = require("./reports");
const logininfoDocs = require("./logininfo");
const locationsDocs = require("./locations");
const authDocs = require("./auth");
const usersDocs = require("./users");
const hcDocs = require("./hc");
const { port, nodeEnv } = require("../../../loadenv");

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
      name: "hc",
      description: "서버 상태 확인",
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
    ...hcDocs,
  },
  components: {
    schemas: {
      ...reportsSchema,
    },
  },
};

module.exports = swaggerDocs;
