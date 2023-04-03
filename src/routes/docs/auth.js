const errorsDocs = require("./errors");

const authDocs = {
  "/auth/sparcssso": {
    get: {
      tags: ["auth"],
      summary: "로그인 페이지로 리다이렉트",
      description: "SPARCS SSO 로그인 페이지로 리다이렉트",
      responses: {},
    },
  },
  "/auth/sparcssso/callback": {
    get: {
      tags: ["auth"],
      summary: "리다이렉트 되었을 때 다시 로그인 시도",
      description:
        "SPARCS SSO 로그인 페이지로부터 다시 리다이렉트되었을 때 로그인을 시도",
      parameters: [],
      responses: {},
    },
  },
  "/auth/logout": {
    get: {
      tags: ["auth"],
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
};

module.exports = authDocs;
