const loginReplacePage = require("@/views/loginReplacePage").default;
const { base64url } = require("@/modules/patterns").default;

const tag = "auth";
const apiPrefix = "/auth(dev)";

const authReplaceDocs = {};
authReplaceDocs[`${apiPrefix}/sparcssso`] = {
  get: {
    tags: [tag],
    summary: "자체 로그인 페이지의 html 소스 반환",
    description: `<b>Dev 환경에서만 사용할 수 있는 API입니다.</b><br/>
      SSO를 사용하지 않기 위해 자체 제작된 replace 페이지로 리다이렉트합니다.`,
    responses: {
      200: {
        description: "자체 로그인 페이지의 html 소스",
        content: {
          "text/plain": {
            type: "string",
            example: loginReplacePage,
          },
        },
      },
    },
  },
};

authReplaceDocs[`${apiPrefix}/login/replace`] = {
  post: {
    tags: [tag],
    summary: "요청받은 정보로 로그인 시도",
    description: `<b>Dev 환경에서만 사용할 수 있는 API입니다.</b><br/>
      DB에 존재하는 아이디라면 로그인 진행 후, 이전 페이지로 리다이렉트 합니다.<br/>
      DB에 존재하지 않는 아이디일 경우, 새로운 사용자를 만들고 로그인 진행 후, 이전 페이지로 리다이렉트 합니다.`,
    requestBody: {
      description: "로그인을 할 사용자의 아이디",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              id: {
                type: "string",
              },
            },
          },
        },
      },
    },
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
            example: "Auth/login/replace : invalid request",
          },
        },
      },
    },
  },
};

authReplaceDocs[`${apiPrefix}/sparcsapp/login`] = {
  get: {
    tags: [tag],
    summary: "원앱 사용자를 위해 자체 로그인 페이지의 html 소스 반환",
    description: `<b>Dev 환경에서만 사용할 수 있는 API입니다.</b><br/>
      SSO를 사용하지 않기 위해 자체 제작된 replace 페이지로 리다이렉트합니다. 이 페이지를 통해 로그인하는 경우 원앱 사용자인 것으로 처리합니다.`,
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
      200: {
        description: "자체 로그인 페이지의 html 소스",
        content: {
          "text/plain": {
            type: "string",
            example: loginReplacePage,
          },
        },
      },
    },
  },
};

module.exports = authReplaceDocs;
