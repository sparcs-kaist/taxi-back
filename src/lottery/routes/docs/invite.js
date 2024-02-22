const { eventConfig } = require("../../../../loadenv");
const apiPrefix = `/events/${eventConfig?.mode}/invite`;

const inviteDocs = {};
inviteDocs[`${apiPrefix}/search/:inviter`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "초대자 정보 조회",
    description: "초대자의 정보를 조회합니다.",
    requestBody: {
      description: "",
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/searchInviterHandler",
          },
        },
      },
    },
    responses: {
      200: {
        description: "",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["nickname", "profileImageUrl"],
              properties: {
                nickname: {
                  type: "string",
                  description: "초대자의 닉네임",
                  example: "asdf",
                },
                profileImageUrl: {
                  type: "string",
                  description: "초대자의 프로필 이미지 URL",
                  example: "IMAGE URL",
                },
              },
            },
          },
        },
      },
    },
  },
};
inviteDocs[`${apiPrefix}/create`] = {
  post: {
    tags: [`${apiPrefix}`],
    summary: "초대 링크 생성",
    description: "초대 링크를 생성합니다.",
    responses: {
      200: {
        description: "",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["inviteUrl"],
              properties: {
                inviteUrl: {
                  type: "string",
                  description: "초대 링크",
                  example: "INVITE URL",
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = inviteDocs;
