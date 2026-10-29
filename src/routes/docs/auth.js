const { base64url } = require("@/modules/patterns").default;

const tag = "auth";
const apiPrefix = "/auth";

const authDocs = {};
authDocs[`${apiPrefix}/sparcssso`] = {
  get: {
    tags: [tag],
    summary: "SPARCS SSO 로그인 페이지로 리다이렉트",
    description: "SSO 로그인 페이지로 리다이렉트합니다.",
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
      "SPARCS SSO 로그인 페이지로부터 프론트로 다시 리다이렉트되었을 때 로그인을 시도.",
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
            example: "Auth/sparcssso/callback : invalid request",
          },
        },
      },
    },
  },
};

authDocs[`${apiPrefix}/login/replace`] = {
  get: {
    tags: [tag],
    summary: "replace 로그인 시도",
    description:
      "개발용으로 만들어진 replace 로그인을 시도합니다. Prod 환경일 경우 error를 반환합니다.",
    responses: {
      400: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                  example: "Auth/login/replace : Bad Request",
                },
              },
            },
          },
        },
      },
    },
  },
};

authDocs[`${apiPrefix}/buddy/resolve`] = {
  post: {
    tags: [tag],
    summary: "버디 SSO 사용자 정보를 택시 사용자와 연결",
    description:
      "버디 백엔드 전용 API 키를 확인하고, 기존 택시 사용자를 찾거나 가입 가능한 사용자를 생성한 뒤 oid를 반환합니다.",
    parameters: [
      {
        in: "header",
        name: "X-BUDDY-API-KEY",
        required: true,
        schema: { type: "string" },
        description: "버디 백엔드와 공유하는 전용 API 키",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: [
              "uid",
              "sid",
              "email",
              "first_name",
              "last_name",
              "gender",
              "birthday",
              "flags",
              "facebook_id",
              "twitter_id",
              "kaist_id",
              "kaist_info",
              "kaist_info_time",
              "kaist_v2_info",
              "kaist_v2_info_time",
              "sparcs_id",
            ],
            description: "SPARCS SSO에서 받은 사용자 정보 전체",
            properties: {
              uid: { type: "string" },
              sid: { type: "string" },
              email: { type: "string" },
              first_name: { type: "string" },
              last_name: { type: "string" },
              gender: { type: "string" },
              birthday: { type: "string" },
              flags: { type: "array", items: { type: "string" } },
              facebook_id: { type: "string", nullable: true },
              twitter_id: { type: "string", nullable: true },
              kaist_id: { type: "string", nullable: true },
              kaist_info: { type: "string", nullable: true },
              kaist_info_time: { type: "string" },
              kaist_v2_info: { type: "string", nullable: true },
              kaist_v2_info_time: { type: "string" },
              sparcs_id: { type: "string", nullable: true },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "택시 사용자 조회 또는 생성 성공",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["oid"],
              properties: {
                oid: {
                  type: "string",
                  description: "택시 User 문서의 ObjectId",
                },
              },
            },
          },
        },
      },
      401: { description: "잘못된 API 키" },
      403: { description: "택시 가입 조건 불충족" },
      503: { description: "Buddy 연동 API 키 미설정" },
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

authDocs[`${apiPrefix}/sparcsapp/login`] = {
  get: {
    tags: [tag],
    summary: "원앱 사용자를 위해 SPARCS SSO 로그인 페이지로 리다이렉트",
    description:
      "SSO 로그인 페이지로 리다이렉트합니다. 이 페이지를 통해 로그인하는 경우 원앱 사용자인 것으로 처리합니다.",
    parameters: [
      {
        in: "query",
        name: "codeChallenge",
        required: true,
        schema: {
          type: "string",
          pattern: base64url.source,
          length: 43,
        },
        description: "Authorization Code Flow에서 사용되는 Challenge 값",
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

authDocs[`${apiPrefix}/sparcsapp/token/issue`] = {
  post: {
    tags: [tag],
    summary: "원앱 사용자를 위해 최초 Token 발급",
    description:
      "Access Token과 Refresh Token을 발급합니다. 원앱 사용자인 경우만 Token을 발급받을 수 있습니다.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["codeVerifier"],
            properties: {
              codeVerifier: {
                type: "string",
                pattern: base64url.source,
                minLength: 43,
                maxLength: 128,
                description: "Authorization Code Flow에서 사용되는 Verifier 값",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Token 발급 성공",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["accessToken", "refreshToken", "ssoInfo"],
              properties: {
                accessToken: {
                  type: "string",
                  description: "새로운 JWT Access Token",
                },
                refreshToken: {
                  type: "string",
                  description: "새로운 Refresh Token",
                },
                ssoInfo: {
                  type: "string",
                  description: "SPARCS SSO에서 전달받은 사용자 정보",
                },
              },
            },
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Auth/sparcsapp/token/issue : invalid request",
          },
        },
      },
    },
  },
};

authDocs[`${apiPrefix}/sparcsapp/token/refresh`] = {
  post: {
    tags: [tag],
    summary: "원앱 사용자를 위해 Token 갱신",
    description:
      "Access Token과 Refresh Token을 갱신합니다. 원앱 사용자인 경우만 Token을 갱신할 수 있습니다.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["refreshToken"],
            properties: {
              refreshToken: {
                type: "string",
                description: "만료되지 않은 유효한 Refresh Token",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Token 갱신 성공",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["accessToken", "refreshToken"],
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
        content: {
          "text/html": {
            example: "Auth/sparcsapp/token/refresh : invalid refresh token",
          },
        },
      },
      403: {
        content: {
          "text/html": {
            example: "Auth/sparcsapp/token/refresh : invalid refresh token",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Auth/sparcsapp/token/refresh : internal server error",
          },
        },
      },
    },
  },
};

module.exports = authDocs;
