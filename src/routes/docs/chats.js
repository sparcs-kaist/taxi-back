const objectIdPattern = require("./utils");

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
                pattern: objectIdPattern,
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
                pattern: objectIdPattern,
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
                pattern: objectIdPattern,
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
    summary: "채팅 요청 처리",
    description: `채팅 요청을 처리합니다.<br/>
    socker 통신을 통하여 같은 방에 있는 user들에게 이 채팅을 전송합니다.`,
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              roomId: {
                type: "string",
                pattern: objectIdPattern,
                description: "채팅을 보내는 방의 id",
              },
              type: {
                type: "string",
                enum: [
                  "text",
                  "s3img",
                  "in",
                  "out",
                  "payment",
                  "settlement",
                  "account",
                  "departure",
                  "arrival",
                ],
                description: `채팅 메시지의 유형<br/>
                일반 text의 경우 *text*, 사진의 경우 *s3img*<br/>
                기타 종류의 채팅의 경우(입장, 퇴장 메시지 등) 정해진 type의 채팅을 사용`,
              },
              content: {
                type: "string",
                example: "안녕하세요~!",
                description: "채팅 메세지의 본문",
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
                value: "Chat/send : socket did not connected",
              },
              "유저가 방에 참여하지 않음": {
                value: "Chat/send : user did not participated in the room",
              },
            },
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Chat/send : internal server error",
          },
        },
      },
    },
  },
};

chatsDocs[`${apiPrefix}/read`] = {
  post: {
    tags: [tag],
    summary: "채팅 읽은 시각 업데이트 요청",
    description: `채팅 읽은 시각의 업데이트 요청을 처리합니다.<br/>
    socket 통신을 통하여 같은 방에 있는 user들에게 업데이트를 요청합니다.`,
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              roomId: {
                type: "string",
                pattern: objectIdPattern,
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
            example: "Chat/read : socket did not connected",
          },
        },
      },
      404: {
        content: {
          "text/html": {
            example: "Chat/read : cannot find room info",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            examples: {
              "소켓 이벤트 전송 오류": {
                value: "Chat/read : failed to emit socket events",
              },
              "기타 서버 오류": {
                value: "Chat/read : internal server error",
              },
            },
          },
        },
      },
    },
  },
};

chatsDocs[`${apiPrefix}/uploadChatImg/getPUrl`] = {
  post: {
    tags: [tag],
    summary: "채팅 이미지를 업로드할 수 있는 Presigned-url을 발급",
    description: `채팅 이미지를 업로드 하기 위한 Presigned-url을 발급합니다.<br/>
    이미지 전송을 위해 \`s3img\` 형식의 chat document를 생성 후 저장하며,<br/>
    presigned-url은 aws S3 api를 통해 생성됩니다.`,
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              roomId: {
                type: "string",
                pattern: objectIdPattern,
                description: "채팅 이미지를 보내는 방의 id",
              },
              type: {
                type: "string",
                enum: ["image/png", "image/jpg", "image/jpeg"],
                description: "채팅 이미지의 파일 형식",
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
                id: {
                  type: "string",
                  pattern: objectIdPattern,
                  description: "생성된 chat Document의 object id",
                },
                url: {
                  type: "string",
                  example: "https://s3.{region}.amazonaws.com/{bucket-name}",
                  description: "taxi s3 url 주소",
                },
                fields: {
                  type: "object",
                  properties: {
                    bucket: {
                      type: "string",
                      example: "bucket-name",
                    },
                    "Content-Type": {
                      type: "string",
                      enum: ["image/png", "image/jpg", "image/jpeg"],
                    },
                    key: {
                      type: "string",
                      pattern: `^chat-img/[a-fA-F\d]{24}$`,
                    },
                  },
                  description: "image의 key, type, bucket와 같은 정보",
                },
              },
            },
          },
        },
      },
      403: {
        content: {
          "text/html": {
            example: "Chat/uploadChatImg/getPUrl : did not joined the chatting",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Chat/uploadChatImg/getPUrl : internal server error",
          },
        },
      },
    },
  },
};

chatsDocs[`${apiPrefix}/uploadChatImg/done`] = {
  post: {
    tags: [tag],
    summary: "채팅 이미지 업로드 완료 여부 확인",
    description: `채팅 이미지가 제대로 업로드 되었는지 확인합니다.<br/>
    이미지가 제대로 업로드 되었다면, socket 통신을 통해 채팅 이미지를 전송합니다.<br/>
    이때 채팅의 \`content\`에는 s3에 저장된 url을 나타내는 채팅의 object id를 넣어줍니다.`,
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              roomId: {
                type: "string",
                pattern: objectIdPattern,
                description: "채팅 이미지를 보내는 방의 id",
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
      404: {
        content: {
          "text/html": {
            example: "Chat/uploadChatImg/done : no corresponding chat",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Chat/uploadChatImg/getPUrl : internal server error",
          },
        },
      },
    },
  },
};

module.exports = chatsDocs;
