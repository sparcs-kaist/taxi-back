const { eventConfig } = require("@/loadenv");
const apiPrefix = `/events/${eventConfig?.mode}/invites`;

const invitesDocs = {};
invitesDocs[`${apiPrefix}/search/{inviter}`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "초대한 유저의 정보 반환",
    description: "초대한 유저의 정보를 가져옵니다.",
    parameters: [
      {
        in: "path",
        name: "inviter",
        required: true,
        description: "초대한 유저의 eventStatus ObjectId",
        example: "INVITER ID",
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["nickname", "profileImageUrl"],
              properties: {
                nickname: {
                  type: "string",
                  description: "초대한 유저의 닉네임",
                  example: "static",
                },
                profileImageUrl: {
                  type: "string",
                  description: "초대한 유저의 프로필 이미지 URL",
                  example: "PROFILE URL",
                },
              },
            },
          },
        },
      },
    },
  },
};
invitesDocs[`${apiPrefix}/create`] = {
  post: {
    tags: [`${apiPrefix}`],
    summary: "초대 링크 생성",
    description: "초대 링크를 생성합니다.",
    responses: {
      200: {
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

module.exports = invitesDocs;
