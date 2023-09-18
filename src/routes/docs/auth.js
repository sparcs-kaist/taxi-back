const errorsDocs = require("./errors");

const authDocs = {
  "/auth/sparcssso": {
    get: {
      tags: ["/auth"],
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
      response: {
        302: {
          description: "SPARCS SSO 로그인 페이지로 리다이렉트",
        },
      },
    },
  },
  "/auth/sparcssso/callback": {
    get: {
      tags: ["/auth"],
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
      response: {
        302: {
          description:
            "로그인 성공 후 페이지, 혹은 로그인 실패 URI로 리다이렉트",
        },
      },
    },
  },
  "/auth/logout": {
    get: {
      tags: ["/auth"],
      summary: "세션 삭제 및 사용자 로그아웃",
      description: "세션 삭제 및 사용자 로그아웃",
      responses: {
        200: {
          content: {
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
        500: errorsDocs["500"],
      },
    },
  },
  "/auth/app/token/login": {
    get: {
      tags: ["/auth"],
    },
  },
  "/auth/app/token/refresh": {
    get: {
      tags: ["/auth"],
    },
  },
  "/auth/app/device": {
    post: {
      tags: ["/auth"],
    },
    delete: {
      tags: ["/auth"],
    },
  },
  "/auth/app/token/generate": {
    get: {
      tags: ["/auth"],
    },
  },
};

module.exports = authDocs;
