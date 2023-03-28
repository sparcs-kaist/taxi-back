const reportsSchema = require("./reportsSchema");
const reportDocs = require("./reports");
const logininfoDocs = require("./logininfo");
const locationsDocs = require("./locations");

const swaggerDocs = {
  openapi: "3.0.3",
  info: {
    title: "Taxi API Document",
    version: "1.0.0",
  },
  basePath: "/",
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
  ],
  consumes: ["application/json"],
  produces: ["application/json"],
  paths: {
    "/reports/create": reportDocs["/reports/create"],
    "/reports/searchByUser": reportDocs["/reports/searchByUser"],
    "/logininfo": logininfoDocs["/logininfo"],
    "/logininfo/detail": logininfoDocs["/logininfo/detail"],
    "/locations": locationsDocs["/locations"],
  },
  components: {
    schemas: {
      createHandler: reportsSchema.createHandler,
    },
  },
  apis: ["src/route/*.js", "src/route/docs/*.json"],
};

module.exports = swaggerDocs;
