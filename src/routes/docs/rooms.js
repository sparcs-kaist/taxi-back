const { objectId, room } = require("@/modules/patterns").default;

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
                pattern: room.name.source,
                description: `방 이름<br/>
                1~50 글자로 구성되며 영어 대소문자, 숫자, 한글, 특정 특수기호("-", ",", ".", "?", "!", "_")만 가능`,
                example: "함께 타는 택시의 여유",
              },
              from: {
                type: "string",
                pattern: objectId.source,
                description: "출발지 location Document의 ObjectId",
              },
              to: {
                type: "string",
                pattern: objectId.source,
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
              "방 생성 기능이 정지당한 경우": {
                value: {
                  error:
                    "Rooms/join : user monday is temporarily restricted from creating rooms until 2024-08-23 15:00:00.",
                },
              },
              "출발지와 도착지가 같음": {
                value: {
                  error: "Rooms/create : locations are same",
                },
              },
              "현재로부터 2주일보다 이후의 방을 생성": {
                value: {
                  error:
                    "Rooms/create : cannot over 2 weeks on the basis of current Date",
                },
              },
              "설정된 출발 시각 이후에 방을 생성": {
                value: {
                  error: "Rooms/create : invalid timestamp",
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
              "사용자가 아직 송금하지 않은 방이 존재": {
                value: {
                  error: "Rooms/create : user has send-required rooms",
                },
              },
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
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
            example: {
              error: "Rooms/create : internal server error",
            },
          },
        },
      },
    },
  },
};

roomsDocs[`${apiPrefix}/publicInfo`] = {
  get: {
    tags: [tag],
    summary: "정산 정보를 제외한 방 세부 사항 반환",
    description:
      "특정 id 방의 정산 정보를 제외한 세부사항을 반환합니다. 로그인을 하지 않아도 접근 가능합니다.",
    parameters: [
      {
        in: "query",
        name: "id",
        schema: {
          type: "string",
          pattern: objectId.source,
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
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                },
              },
            },
            example: {
              error: "Rooms/publicInfo : id does not exist",
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
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
            example: {
              error: "Rooms/publicInfo : internal server error",
            },
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
          pattern: objectId.source,
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
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                },
              },
            },
            example: {
              error: "Rooms/info : id does not exist",
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
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
            example: {
              error: "Rooms/info : internal server error",
            },
          },
        },
      },
    },
  },
};

roomsDocs[`${apiPrefix}/join`] = {
  post: {
    tags: [tag],
    summary: "진행 중인 방에 참여",
    description: `room의 ID를 받아 해당 room의 참가자 목록에 요청을 보낸 사용자를 추가합니다.<br/>
    하나의 User는 최대 5개의 진행중인 방에 참여할 수 있습니다.<br/>
    아직 정원이 차지 않은 방과 아직 출발하지 않은 방에만 참여할 수 있습니다.`,
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              roomId: {
                type: "string",
                pattern: objectId.source,
              },
            },
          },
        },
      },
    },
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
              "방 참여 기능이 정지당한 경우": {
                value: {
                  error:
                    "Rooms/join : user monday is temporarily restricted from joining rooms until 2024-08-23 15:00:00.",
                },
              },
              "사용자가 참여하는 진행 중 방이 5개 이상": {
                value: {
                  error: "Rooms/join : participating in too many rooms",
                },
              },
              "사용자가 아직 송금하지 않은 방이 존재": {
                value: {
                  error: "Rooms/join : user has send-required rooms",
                },
              },
              "입력한 시간의 방이 이미 출발함": {
                value: {
                  error: "Rooms/join : The room has already departed",
                },
              },
              "방의 인원이 모두 찼음": {
                value: {
                  error: "Rooms/join : The room is already full",
                },
              },
            },
          },
        },
      },
      404: {
        description: "해당 id를 가진 방이 존재하지 않음",
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
            example: {
              error: "Rooms/join : no corresponding room",
            },
          },
        },
      },
      409: {
        description: "사용자가 이미 참여중임",
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
            example: {
              error: "Rooms/join : {userID} Already in room",
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
        content: {
          "text/html": {
            example: "Rooms/join : internal server error",
          },
        },
      },
    },
  },
};

roomsDocs[`${apiPrefix}/abort`] = {
  post: {
    tags: [tag],
    summary: "참여 중인 방에서 퇴장",
    description: `room의 ID를 받아 해당 room의 참가자 목록에서 요청을 보낸 사용자를 삭제합니다.<br/>
    출발했지만 정산이 완료되지 않은 방에서는 나갈 수 없습니다.`,
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              roomId: {
                type: "string",
                pattern: objectId.source,
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
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
              "잘못된 userId를 포함한 요청임": {
                value: {
                  error: "Rooms/abort : Bad request",
                },
              },
              "정산이 되지 않은 출발한 방은 나갈 수 없음": {
                value: {
                  error:
                    "Rooms/abort : cannot exit room. Settlement is not done",
                },
              },
            },
          },
        },
      },
      403: {
        description: "사용자가 해당 방의 구성원이 아님",
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
            example: {
              error: "Rooms/abort : did not joined the room",
            },
          },
        },
      },
      404: {
        description: "해당 id를 가진 방이 존재하지 않음",
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
            example: {
              error: "Rooms/abort : no corresponding room",
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
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
            example: {
              error: "Rooms/abort : internal server error",
            },
          },
        },
      },
    },
  },
};

roomsDocs[`${apiPrefix}/search`] = {
  get: {
    tags: [tag],
    summary: "방 검색",
    description: `출발지/도착지/날짜를 받아 조건에 맞는 방을 검색합니다.<br/>
    조건에 맞는 방이 있을 경우, 방들의 정보를 반환하고 없다면 빈 배열을 반환합니다.<br/>
    로그인을 하지 않아도 접근 가능합니다.`,
    parameters: [
      {
        in: "query",
        name: "name",
        schema: {
          type: "string",
        },
        description: `검색할 방의 이름<br/>
        주어진 경우 해당 텍스트가 방의 이름에 포함된 방들만 반환.<br/>
        주어지지 않은 경우 임의의 이름을 가지는 방들을 검색.`,
      },
      {
        in: "query",
        name: "from",
        schema: {
          type: "string",
          pattern: objectId.source,
        },
        description: `출발지 Document의 ObjectId<br/>
        주어진 경우 출발지가 일치하는 방들만 반환.<br/>
        주어지지 않은 경우 임의의 출발지를 가지는 방들을 검색.`,
      },
      {
        in: "query",
        name: "to",
        schema: {
          type: "string",
          pattern: objectId.source,
        },
        description: `도착지 Document의 ObjectId<br/>
        주어진 경우 도착지가 일치하는 방들만 반환.<br/>
        주어지지 않은 경우 임의의 도착지를 가지는 방들을 검색.`,
      },
      {
        in: "query",
        name: "time",
        schema: {
          type: "string",
          format: "date-time",
        },
        description: `출발 시각<br/>
        주어진 경우 주어진 시간부터 주어진 시간부터 그 다음에 찾아오는 오전 5시 전에 출발하는 방들만 반환.<br/>
        주어지지 않은 경우 현재 시각부터 그 다음으로 찾아오는 오전 5시 전까지의 방들을 반환.`,
      },
      {
        in: "query",
        name: "withTime",
        schema: {
          type: "boolean",
        },
        description: `검색 옵션에 시간 옵션이 포함되어 있는지 여부.<br/>
        false이고 검색하는 날짜가 오늘 이후인 경우 검색하는 시간을 0시 0분 0초로 설정함.`,
      },
      {
        in: "query",
        name: "maxPartLength",
        schema: {
          type: "integer",
        },
        description: ` 방의 최대 인원 수.<br/>
        주어진 경우 최대 인원 수가 일치하는 방들만 반환.<br/>
        주어지지 않은 경우 임의의 최대 인원 수를 가지는 방들을 검색.`,
      },
      {
        in: "query",
        name: "isHome",
        schema: {
          type: "boolean",
        },
        description: `홈 페이지 검색인지 여부<br/>
        true인 경우 검색 날짜 범위를 7일로 설정.<br/>
        false인 경우 검색 날짜 범위를 14일로 설정.<br/>`,
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                $ref: "#/components/schemas/room",
              },
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
                  error: "Rooms/search : Bad request",
                },
              },
              "출발/도착지가 존재하지 않는 장소": {
                value: {
                  error: "Rooms/search : no corresponding locations",
                },
              },
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
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
            example: {
              error: "Rooms/search : internal server error",
            },
          },
        },
      },
    },
  },
};

roomsDocs[`${apiPrefix}/searchByUser`] = {
  get: {
    tags: [tag],
    summary: "사용자가 참여 중인 방 검색",
    description: `로그인 된 사용자가 참여 중인 방을 검색합니다.<br/>
    정산 완료 여부 기준으로 진행 중인 방과 완료된 방을 \`ongoing\`과 \`done\`으로 각각 분리하여 응답을 전송합니다.<br/>
    (\`ongoing\`은 \`isOver\`이 flase인 방, \`done\`은 \`isOver\`이 true인 방을 의미합니다.)`,
    parameters: {},
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ongoing: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/room",
                  },
                },
                done: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/room",
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
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
            example: {
              error: "Rooms/searchByUser : internal server error",
            },
          },
        },
      },
    },
  },
};

roomsDocs[`${apiPrefix}/searchByTimeGap`] = {
  get: {
    tags: [tag],
    summary: "검색하려는 시간 범위에 따른 방 검색",
    description: `출발지/도착지/날짜를 받아 조건에 맞는 방을 검색합니다.<br/>
    조건에 맞는 방이 있을 경우, 방들의 정보를 반환하고 없다면 빈 배열을 반환합니다.<br/>
    로그인을 하지 않아도 접근 가능합니다.`,
    parameters: [
      {
        in: "query",
        name: "from",
        schema: {
          type: "string",
          pattern: objectId.source,
        },
        description: `출발지 Document의 ObjectId<br/>
        주어진 경우 출발지가 일치하는 방들만 반환.<br/>
        주어지지 않은 경우 예외처리.`,
      },
      {
        in: "query",
        name: "to",
        schema: {
          type: "string",
          pattern: objectId.source,
        },
        description: `도착지 Document의 ObjectId<br/>
        주어진 경우 도착지가 일치하는 방들만 반환.<br/>
        주어지지 않은 경우 예외처리.`,
      },
      {
        in: "query",
        name: "time",
        schema: {
          type: "string",
          format: "date-time",
        },
        description: `출발 시각<br/>
        주어지지 않은 경우 예외처리.`,
      },
      {
        in: "query",
        name: "timeGap",
        schema: {
          type: "integer",
          minimum: 0,
          maximum: 60,
        },
        description: `검색하려는 시간 범위<br/>
        주어진 경우 현재 시각부터 \`timeGap\` 시간 이후까지의 방들을 검색.<br/>
        주어지지 않은 경우 앞뒤로 25분 범위의 방들을 검색.`,
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ongoing: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/room",
                  },
                },
                done: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/room",
                  },
                },
              },
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
                  error: "Rooms/searchByTimeGap : Bad request",
                },
              },
              "출발/도착지가 존재하지 않는 장소": {
                value: {
                  error: "Rooms/searchByTimeGap : Invalid 'from/to' location",
                },
              },
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
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
            example: {
              error: "Rooms/searchByTimeGap : internal server error",
            },
          },
        },
      },
    },
  },
};

roomsDocs[`${apiPrefix}/commitSettlement`] = {
  post: {
    tags: [tag],
    summary: "방 정산 요청 처리",
    description: `해당 방에 요청을 보낸 유저를 결제자로 처리하여, 다른 유저들에게 정산을 요청합니다.<br/>
    이미 출발한 방에 대해서만 요청을 처리합니다.<br/>
    방의 \`part\` 배열에서 요청을 보낸 유저의 \`isSettlement\` 속성은 \`paid\`로 설정됩니다.<br/>
    나머지 유저들의 \`isSettlement\` 속성을 \`send-required\`로 설정합니다.`,
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              roomId: {
                type: "string",
                pattern: objectId.source,
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "결제 정보가 수정된 방의 세부 정보가 담긴 room Object",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/room",
            },
          },
        },
      },
      404: {
        description: `잘못된 방 요청<br/>
          (사용자가 참여 중인 방이 아니거나, 이미 다른 사람이 결제자이거나, 아직 방이 출발하지 않은 경우)`,
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
            example: {
              error: "Rooms/:id/commitSettlement : cannot find settlement info",
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
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
            example: {
              error: "Rooms/:id/commitSettlement : internal server error",
            },
          },
        },
      },
    },
  },
};

roomsDocs[`${apiPrefix}/commitPayment`] = {
  post: {
    tags: [tag],
    summary: "방 송금 처리",
    description: `해당 방에 요청을 보낸 유저를 송금을 완료한 정산 완료로 처리합니다.<br/>
    방의 \`part\` 배열에서 요청을 보낸 유저의 \`isSettlement\` 속성은 \`send-required\`에서 \`sent\`로 변경합니다.<br/>
    방의 참여한 유저들이 모두 정산완료를 하면 방의 \`isOver\` 속성이 \`true\`로 변경되며, 과거 방으로 취급됩니다.`,
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              roomId: {
                type: "string",
                pattern: objectId.source,
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "결제 정보가 수정된 방의 세부 정보가 담긴 room Object",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/room",
            },
          },
        },
      },
      404: {
        description: `잘못된 방 요청<br/>
        (사용자가 참여 중인 방이 아니거나, 사용자가 결제를 했거나 이미 정산한 경우)`,
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
            example: {
              error: "Rooms/:id/commitPayment : cannot find settlement info",
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
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
            example: {
              error: "Rooms/:id/commitPayment : internal server error",
            },
          },
        },
      },
    },
  },
};

roomsDocs[`${apiPrefix}/carrier/toggle`] = {
  post: {
    tags: [tag],
    summary: "방 캐리어 보유 여부 토글",
    description: `해당 방에 참여중인 사용자가 캐리어를 보유했는지 여부를 토글합니다.<br/>
    방의 \`part\` 배열에서 해당 사용자의 \`hasCarrier\` 속성이 true/false로 갱신됩니다.`,
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              roomId: {
                type: "string",
                pattern: objectId.source,
              },
              hasCarrier: {
                type: "boolean",
                description: "보유 여부",
              },
            },
            required: ["roomId", "hasCarrier"],
          },
        },
      },
    },
    responses: {
      200: {
        description: "갱신된 방의 세부 정보가 담긴 room Object",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/room",
            },
          },
        },
      },
      404: {
        description: "잘못된 방 요청 (사용자가 참여중인 방이 아님)",
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
            example: {
              error: "Rooms/carrier/toggle : cannot find room info",
            },
          },
        },
      },
      500: {
        description: "내부 서버 오류",
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
            example: {
              error: "Rooms/carrier/toggle : internal server error",
            },
          },
        },
      },
    },
  },
};

module.exports = roomsDocs;
