const { objectIdPattern, roomsPattern } = require("./utils");

const tag = "rooms";
const apiPrefix = "/rooms";

const roomsDocs = {};

roomsDocs[`${apiPrefix}/create`] = {
  post: {
    tags: [tag],
    summary: "방 생성",
    description: `방을 생성합니다. 한 유저당 최대 5개의 진행중인 방에 참여할 수 있습니다.<br/>`,
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                pattern: roomsPattern.rooms.name,
                description: `방 이름<br/>
                1~50 글자로 구성되며 영어 대소문자, 숫자, 한글, 특정 특수기호("-", ",", ".", "?", "!", "_")만 가능`,
              },
              from: {
                type: "string",
                pattern: roomsPattern.rooms.from,
                description: "출발지 location Document의 ObjectId",
              },
              to: {
                type: "string",
                pattern: roomsPattern.rooms.to,
                description: "도착지 location Document의 ObjectId",
              },
              time: {
                type: "string",
                format: "date-time",
                description: "방 출발 시각. 현재 이후여야 함.",
              },
              maxPartLength: {
                type: "integer",
                minimum: 2,
                maximum: 4,
                description: "방의 최대 인원 수",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "생성 완성된 방 목록",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/room",
            },
          },
        },
      },
      400: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                },
              },
            },
            examples: {
              "출발지와 도착지가 같음": {
                value: {
                  error: "Room/create : locations are same",
                },
              },
              "현재로부터 2주일보다 이후의 방을 생성": {
                value: {
                  error:
                    "Room/create : cannot over 2 weeks on the basis of current Date",
                },
              },
              "존재하지 않는 location Document를 입력": {
                value: {
                  error: "Rooms/create : no corresponding locations",
                },
              },
              "사용자가 참여하는 진행 중 방이 5개 이상": {
                value: {
                  error: "Rooms/create : participating in too many rooms",
                },
              },
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
        content: {
          "text/html": {
            example: "Rooms/create : internal server error",
          },
        },
      },
    },
  },
};

roomsDocs[`${apiPrefix}/publicInfo`] = {
  get: {
    tags: [tag],
    summary: "정산 정보를 제외한 방 세부 사항 반환 (로그인 필요 x)",
    description:
      "특정 id 방의 정산 정보를 제외한 세부사항을 반환합니다. 로그인을 하지 않아도 접근 가능합니다.",
    parameters: [
      {
        in: "query",
        name: "id",
        schema: {
          type: "string",
          pattern: objectIdPattern,
        },
        description: "찾고 싶은 방의 Object id",
      },
    ],
    responses: {
      200: {
        description: "방의 세부 정보가 담긴 room Object",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/room",
            },
          },
        },
      },
      404: {
        description: "해당 id가 존재하지 않음",
        content: {
          "text/html": {
            example: "Rooms/publicInfo : id does not exist",
          },
        },
      },
      500: {
        description: "내부 서버 오류",
        content: {
          "text/html": {
            example: "Rooms/publicInfo : internal server error",
          },
        },
      },
    },
  },
};

roomsDocs[`${apiPrefix}/info`] = {
  get: {
    tags: [tag],
    summary: "방 세부 사항 반환",
    description: "유저가 참여한 방의 세부사항을 반환합니다.",
    parameters: [
      {
        in: "query",
        name: "id",
        schema: {
          type: "string",
          pattern: objectIdPattern,
        },
        description: "찾고 싶은 방의 Object id",
      },
    ],
    responses: {
      200: {
        description: "방의 세부 정보가 담긴 room Object",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/room",
            },
          },
        },
      },
      404: {
        description: "해당 id가 존재하지 않음",
        content: {
          "text/html": {
            example: "Rooms/info : id does not exist",
          },
        },
      },
      500: {
        description: "내부 서버 오류",
        content: {
          "text/html": {
            example: "Rooms/info : internal server error",
          },
        },
      },
    },
  },
};

roomsDocs[`${apiPrefix}/join`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/abort`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/search`] = {
  get: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/searchByUser`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/commitPayment`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/commitSettlement`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

module.exports = roomsDocs;
