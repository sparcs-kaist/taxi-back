const tag = "chats";
const apiPrefix = "/chats";

const chatsDocs = {};
chatsDocs[`${apiPrefix}`] = {
  post: {
    tags: [tag],
    summary: "가장 최근 채팅 가져오기",
    description: "가장 최근에 도착한 60개의 채팅을 가져옵니다.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              roomId: {
                type: "string",
                description: "채팅을 보내는 방의 id",
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
              type: "object",
              properties: {
                result: {
                  type: "boolean",
                  value: true,
                },
              },
            },
          },
        },
      },
      403: {
        content: {
          "text/html": {
            examples: {
              "소켓 연결 오류": { value: "Chat/ : socket did not connected" },
              "유저가 방에 참여하지 않음": {
                value: "Chat/ : user did not participated in the room",
              },
            },
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Chat/ : internal server error",
          },
        },
      },
    },
  },
};

chatsDocs[`${apiPrefix}/load/before`] = {
  post: {
    tags: [tag],
    summary: "특정 시점 이전의 채팅 가져오기",
    description: "lastMsgDate 이전에 도착한 60개의 채팅을 가져옵니다.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              roomId: {
                type: "string",
                description: "채팅을 보내는 방의 id",
              },
              lastMsgDate: {
                type: "string",
                format: "date-time",
                description: "이전 채팅을 가져올 특정 시점",
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
              type: "object",
              properties: {
                result: {
                  type: "boolean",
                  value: true,
                },
              },
            },
          },
        },
      },
      403: {
        content: {
          "text/html": {
            examples: {
              "소켓 연결 오류": {
                value: "Chat/load/before : socket did not connected",
              },
              "유저가 방에 참여하지 않음": {
                value:
                  "Chat/load/before : user did not participated in the room",
              },
            },
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Chat/load/before : internal server error",
          },
        },
      },
    },
  },
};

chatsDocs[`${apiPrefix}/load/after`] = {
  post: {
    tags: [tag],
    summary: "특정 시점 이후 채팅 가져오기",
    description: "lastMsgDate 이후에 도착한 60개의 채팅을 가져옵니다.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              roomId: {
                type: "string",
                description: "채팅을 보내는 방의 id",
              },
              lastMsgDate: {
                type: "string",
                format: "date-time",
                description: "이전 채팅을 가져올 특정 시점",
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
              type: "object",
              properties: {
                result: {
                  type: "boolean",
                  value: true,
                },
              },
            },
          },
        },
      },
      403: {
        content: {
          "text/html": {
            examples: {
              "소켓 연결 오류": {
                value: "Chat/load/after : socket did not connected",
              },
              "유저가 방에 참여하지 않음": {
                value:
                  "Chat/load/after : user did not participated in the room",
              },
            },
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Chat/load/after : internal server error",
          },
        },
      },
    },
  },
};

chatsDocs[`${apiPrefix}/send`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

chatsDocs[`${apiPrefix}/read`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

chatsDocs[`${apiPrefix}/uploadChatImg/getPUrl`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

chatsDocs[`${apiPrefix}/uploadChatImg/done`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

module.exports = chatsDocs;
