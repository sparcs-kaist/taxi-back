const tag = "auth";
const apiPrefix = "/auth";

const authDocs = {};
authDocs[`${apiPrefix}/sparcssso`] = {
  get: {
    tags: [tag],
    summary: "SPARCS SSO 로그인 페이지로 리다이렉트",
    description:
      "Prod의 경우 SSO 로그인 페이지로, Dev의 경우 replace 페이지로 리다이렉트함.",
    parameters: [
      {
        in: "query",
        name: "redirect",
        schema: {
          type: "string",
        },
        description: "리다이렉트 URI",
      },
      {
        in: "query",
        name: "isApp",
        schema: {
          type: "boolean",
        },
        description: "앱인지 여부",
      },
    ],
    responses: {
      302: {
        description: "SPARCS SSO 로그인 페이지로 리다이렉트",
        headers: {
          Location: {
            type: "string",
            description: "SPARCS SSO 로그인 페이지",
            format: "uri",
          },
        },
      },
    },
  },
};

authDocs[`${apiPrefix}/sparcssso/callback`] = {
  get: {
    tags: [tag],
    summary: "SPARCS SSO 로그인 페이지에서 다시 리다이렉트를 처리",
    description:
      "SPARCS SSO 로그인 페이지로부터 프론트로 다시 리다이렉트되었을 때 로그인을 시도함.",
    parameters: [
      {
        in: "query",
        name: "code",
        schema: {
          type: "string",
        },
        description: "SSO server에서 부여한 유저 정보를 위한 code",
      },
      {
        in: "query",
        name: "state",
        schema: {
          type: "string",
        },
        description: "login 성공 여부 확인을 위한 state",
      },
    ],
    responses: {
      302: {
        description:
          "로그인 성공 후 페이지 URI로, 혹은 로그인 실패 URI로 리다이렉트",
        headers: {
          Location: {
            type: "string",
            description: "로그인 성공 후 페이지 URI, 혹은 로그인 실패 URI",
            format: "uri",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "SparcsssoCallbackHandler : invalid request",
          },
        },
      },
    },
  },
};

authDocs[`${apiPrefix}/logout`] = {
  get: {
    tags: [tag],
    summary: "세션 삭제 및 사용자 로그아웃",
    description: "세션 삭제 및 사용자 로그아웃",
    parameters: [
      {
        in: "query",
        name: "redirect",
        schema: {
          type: "string",
        },
        description: "로그아웃 후 리다이렉트 URI",
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ssoLogoutUrl: {
                  type: "string",
                  description: "SSO 로그아웃 URL",
                },
              },
            },
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Auth/logout : internal server error",
          },
        },
      },
    },
  },
};

authDocs[`${apiPrefix}/app/token/login`] = {
  get: {
    tags: [tag],
    summary: "Access token을 사용하여 로그인",
    description: "앱에서 Access Token을 사용하여 로그인 시도",
    parameters: [
      {
        in: "query",
        name: "accessToken",
        schema: {
          type: "string",
        },
        description: "만료 되지 않은 유효한 JWT Access Token",
      },
      {
        in: "query",
        name: "deviceToken",
        schema: {
          type: "string",
        },
        description: "Device Token",
      },
    ],
    responses: {
      200: {
        description: "성공 메세지",
        content: {
          "text/html": {
            example: "success",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "invalid request",
          },
        },
      },
      401: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                },
              },
            },
            examples: {
              "Invalid token": {
                value: {
                  message: "Invalid token",
                },
              },
              "Expired token": {
                value: {
                  message: "Expired token",
                },
              },
              "Not Access token": {
                value: {
                  message: "Not Access token",
                },
              },
              "No corresponding user": {
                value: {
                  message: "No corresponding user",
                },
              },
            },
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "server error",
          },
        },
      },
    },
  },
};

authDocs[`${apiPrefix}/app/token/refresh`] = {
  get: {
    tags: [tag],
    summary: "만료된 Access Token 갱신",
    description: "앱에서 Access Token을 Refresh Token을 활용하여 갱신",
    parameters: [
      {
        in: "query",
        name: "accessToken",
        schema: {
          type: "string",
        },
        description: "만료된 유효한 JWT Access Token",
      },
      {
        in: "query",
        name: "refreshToken",
        schema: {
          type: "string",
        },
        description: "만료되지 않은 유효한 JWT Refresh Token",
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                accessToken: {
                  type: "string",
                  description: "새로운 JWT Access Token",
                },
                refreshToken: {
                  type: "string",
                  description: "새로운 Refresh Token",
                },
              },
            },
          },
        },
      },
      400: {
        "text/html": {
          example: "invalid request",
        },
      },
      401: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                },
              },
            },
            examples: {
              "Invalid access token": {
                value: {
                  message: "Invalid access token",
                },
              },
              "Invalid token": {
                value: {
                  message: "Invalid token",
                },
              },
              "Expired token": {
                value: {
                  message: "Expired token",
                },
              },
              "Not Refresh token": {
                value: {
                  message: "Not Refresh token",
                },
              },
            },
          },
        },
      },
      501: {
        content: {
          "text/html": {
            example: "server error",
          },
        },
      },
    },
  },
};

authDocs[`${apiPrefix}/app/device`] = {
  post: {
    tags: [tag],
    summary: "기기의 Device Token을 데이터베이스에 등록",
    description: "App 기기의 Device Token을 데이터베이스에 등록",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              accessToken: {
                type: "string",
                description: "만료 되지 않은 유효한 JWT Access Token",
              },
              deviceToken: {
                type: "string",
                description: "Firebase 라이브러리에서 제공해주는 Device Token",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "성공 메세지",
        content: {
          "text/html": {
            example: "success",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "invalid request",
          },
        },
      },
      401: {
        content: {
          "text/html": {
            example: "unauthorized",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "server error",
          },
        },
      },
    },
  },
  delete: {
    tags: [tag],
    summary: "기기의 Device Token을 데이터베이스에서 삭제",
    description: "App 기기의 Device Token을 데이터베이스에 삭제",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              accessToken: {
                type: "string",
                description: "만료 되지 않은 유효한 JWT accessToken",
              },
              deviceToken: {
                type: "string",
                description: "Firebase 라이브러리에서 제공해주는 DeviceToken",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "성공 메세지",
        content: {
          "text/html": {
            example: "success",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "invalid request",
          },
        },
      },
      401: {
        content: {
          "text/html": {
            example: "unauthorized",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "server error",
          },
        },
      },
    },
  },
};

module.exports = authDocs;
