const reportsSchema = require("./reportsSchema");

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
    "/reports/create": {
      post: {
        tags: ["reports"],
        summary: "신고 작성",
        description: "주어진 유저를 전달된 사유로 신고함",
        requestBody: {
          description: "Update an existent user in the store",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/createHandler",
              },
            },
          },
        },
        responses: {
          200: {
            description: "report successful",
            content: {
              "text/plain": {
                schema: {
                  type: "string",
                  example: "report successful",
                },
              },
            },
          },
          500: {
            description: "internal server error",
            content: {
              "text/plain": {
                schema: {
                  type: "string",
                  example: "internal server error",
                },
              },
            },
          },
        },
      },
    },
    "/reports/searchByUser": {
      get: {
        tags: ["reports"],
        summary: "신고 내역 반환",
        description:
          "로그인된 사용자의 신고한 내역과, 신고받은 내역을 반환한다 <br/>1000개의 limit이 있다.",
        responses: {
          200: {
            description: "신고된 내역과 신고 받은 내역",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reporting: {
                      type: "array",
                    },
                    reported: {
                      type: "array",
                    },
                  },
                },
              },
            },
          },
          500: {
            description: "internal server error",
            content: {
              "text/plain": {
                schema: {
                  type: "string",
                  example: "internal server error",
                },
              },
            },
          },
        },
      },
    },
    "/logininfo/detail": {
      get: {
        tags: ["logininfo"],
        summary: "상세한 사용자 정보 반환",
        description: "로그인되어 있는 사용자의 <b>상세한</b> 정보를 반환",
        responses: {
          200: {
            description:
              "사용자의 로그인 세션이 유효한 경우, 현재 로그인된 사용자의 정보를 반환, <br/>\n 세션이 유효하지 않은 경우, 빈 오브젝트를 반환",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    oid: {
                      type: "string",
                    },
                    id: {
                      type: "string",
                      description: "사용자 id",
                    },
                    name: {
                      type: "string",
                      description: "사용자 이름",
                    },
                    nickname: {
                      type: "string",
                    },
                    withdraw: {
                      type: "boolean",
                    },
                    ban: {
                      type: "boolean",
                    },
                    joinat: {
                      type: "string",
                      format: "date-time",
                    },
                    agreeOnTermsOfService: {
                      type: "boolean",
                    },
                    subinfio: {
                      type: "object",
                      properties: {
                        kaist: {
                          type: "string",
                          description: "KAIST 학번(8자리)",
                          minLength: 8,
                          maxLength: 8,
                          example: "20190052",
                        },
                        sparcs: {
                          type: "string",
                        },
                        facebook: {
                          type: "string",
                        },
                        twitter: {
                          type: "string",
                        },
                      },
                    },
                    email: {
                      type: "string",
                      example: "geon6757@kaist.ac.kr",
                    },
                    profileImgUrl: {
                      type: "string",
                    },
                    account: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/logininfo": {
      get: {
        tags: ["logininfo"],
        summary: "사용자 정보 반환",
        description: "로그인되어 있는 사용자의 정보를 반환",
        responses: {
          200: {
            description:
              "사용자의 로그인 세션이 유효한 경우, 현재 로그인된 사용자의 정보를 반환, <br/> 세션이 유효하지 않은 경우, 빈 오브젝트를 반환",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "사용자 id",
                    },
                    sid: {
                      type: "string",
                      description: "사용자 sid",
                    },
                    name: {
                      type: "string",
                      description: "사용자 이름",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/locations": {
      get: {
        tags: ["locations"],
        summary: "출발지/도착지 정보 반환",
        description:
          "출발지/도착지로 사용 가능한 장소 목록 조회 및 요청 처리 당시 서버 시각 반환 <br/>\n       (로그인된 상태에서만 접근 가능)",
        responses: {
          200: {
            description:
              "서버에 저장된 location이 없을 경우, locations은 빈 배열",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    locations: {
                      type: "array",
                      description: "출발지/도착지로 사용 가능한 장소 목록",
                      items: {
                        type: "object",
                        properties: {
                          priority: {
                            type: "number",
                          },
                          isValid: {
                            type: "boolean",
                          },
                          _id: {
                            type: "string",
                          },
                          koName: {
                            type: "string",
                            description: "장소의 한국어 명칭",
                            example: "택시승강장",
                          },
                          enName: {
                            type: "string",
                            description: "장소의 영어 명칭",
                            example: "Taxi Stand",
                          },
                        },
                      },
                    },
                    serverTime: {
                      type: "string",
                      format: "date-time",
                      description: "요청 처리 당시 서버 시각",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      createHandler: reportsSchema,
    },
  },
  apis: ["src/route/*.js", "src/route/docs/*.json"],
};

module.exports = swaggerDocs;
