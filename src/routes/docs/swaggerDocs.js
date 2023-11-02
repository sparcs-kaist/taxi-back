const reportsSchema = require("./reportsSchema");
const reportsDocs = require("./reports");
const logininfoDocs = require("./logininfo");
const locationsDocs = require("./locations");
const usersDocs = require("./users");
const { port, nodeEnv } = require("../../../loadenv");

const serverList = [
  {
    url: `http://localhost:${port}`,
    description: "local api server",
    type: "development",
  },
  {
    url: "https://taxi.sparcs.org/api",
    description: "taxi main api server",
    type: "production",
  },
  {
    url: "https://taxi.dev.sparcs.org/api",
    description: "taxi dev api server",
    type: "production",
  },
];

const swaggerDocs = {
  openapi: "3.0.3",
  info: {
    title: "Taxi API Document",
    version: "1.0.0",
  },
  basePath: "/",
  servers: serverList.filter((server) => server.type === nodeEnv),
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
      name: "users",
      description: "유저 계정 정보 수정 및 조회",
    },
  ],
  consumes: ["application/json"],
  produces: ["application/json"],
  paths: {
    ...reportsDocs,
    ...logininfoDocs,
    ...locationsDocs,
    ...usersDocs,
  },
  components: {
    schemas: {
      ...reportsSchema,
    },
  },
};

module.exports = swaggerDocs;
