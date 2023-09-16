const { eventMode } = require("../../../../loadenv");
const apiPrefix = `/events/${eventMode}/public-notice`;

const publicNoticeDocs = {};
publicNoticeDocs[`${apiPrefix}/leaderboard`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "리더보드 반환",
    description:
      "티켓 개수(고급 티켓은 일반 티켓 5개와 등가입니다.) 기준의 리더보드와 관련된 정보를 가져옵니다.",
    responses: {
      200: {
        description: "",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["leaderboard"],
              properties: {
                leaderboard: {
                  type: "array",
                  description: "상위 20명만 포함된 리더보드",
                  items: {
                    type: "object",
                    required: [
                      "nickname",
                      "profileImageUrl",
                      "ticket1Amount",
                      "ticket2Amount",
                      "probability",
                    ],
                    properties: {
                      nickname: {
                        type: "string",
                        description: "유저의 닉네임",
                        example: "asdf",
                      },
                      profileImageUrl: {
                        type: "string",
                        description: "프로필 이미지 URL",
                        example: "IMAGE URL",
                      },
                      ticket1Amount: {
                        type: "number",
                        description: "일반 티켓의 개수. 0 이상입니다.",
                        example: 10,
                      },
                      ticket2Amount: {
                        type: "number",
                        description: "고급 티켓의 개수. 0 이상입니다.",
                        example: 10,
                      },
                      probability: {
                        type: "number",
                        description: "1등 당첨 확률",
                        example: 0.001,
                      },
                    },
                  },
                },
                rank: {
                  type: "number",
                  description: "유저의 리더보드 순위. 1부터 시작합니다.",
                  example: 30,
                },
                probability: {
                  type: "number",
                  description: "1등 당첨 확률",
                  example: 0.00003,
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = publicNoticeDocs;
