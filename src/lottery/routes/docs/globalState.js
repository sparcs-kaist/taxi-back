const { eventConfig } = require("@/loadenv");
const apiPrefix = `/events/${eventConfig?.mode}/globalState`;

const globalStateDocs = {};
globalStateDocs[`${apiPrefix}/`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "Frontend에서 Global State로 관리하는 정보 반환",
    description:
      "유저의 재화 개수, 퀘스트 완료 상태 등 Frontend에서 Global State로 관리하는 정보를 가져옵니다.",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "isAgreeOnTermsOfEvent",
                "isBanned",
                "creditAmount",
                "quests",
                "completedQuests",
              ],
              properties: {
                isAgreeOnTermsOfEvent: {
                  type: "boolean",
                  description: "유저의 이벤트 참여 동의 여부",
                  example: true,
                },
                isBanned: {
                  type: "boolean",
                  description: "유저의 이벤트 참여 제한 여부",
                  example: false,
                },
                creditAmount: {
                  type: "number",
                  description: "유저의 재화 개수. 0 이상의 정수입니다.",
                  example: 1000,
                },
                quests: {
                  type: "array",
                  description: "전체 퀘스트의 배열",
                  items: {
                    type: "object",
                    required: [
                      "id",
                      "name",
                      "description",
                      "imageUrl",
                      "reward",
                      "maxCount",
                      "isApiRequired",
                    ],
                    properties: {
                      id: {
                        type: "string",
                        description: "퀘스트의 Id",
                        example: "QUEST ID",
                      },
                      name: {
                        type: "string",
                        description: "퀘스트의 이름",
                        example: "최초 로그인 퀘스트",
                      },
                      description: {
                        type: "string",
                        description: "퀘스트의 설명",
                        example:
                          "처음으로 이벤트 기간 중 Taxi에 로그인하면 송편을 드립니다.",
                      },
                      imageUrl: {
                        type: "string",
                        description: "퀘스트의 썸네일 이미지 URL",
                        example: "THUMBNAIL URL",
                      },
                      reward: {
                        type: "object",
                        required: ["credit"],
                        properties: {
                          credit: {
                            type: "number",
                            description: "퀘스트의 완료 보상 중 재화의 개수",
                            example: 100,
                          },
                        },
                      },
                      maxCount: {
                        type: "number",
                        description: "퀘스트의 최대 완료 가능 횟수",
                        example: 1,
                      },
                      isApiRequired: {
                        type: "boolean",
                        description: `/events/${eventConfig?.mode}/quests/complete/:questId API를 통해 퀘스트 완료를 요청해야 하는지의 여부`,
                        example: false,
                      },
                    },
                  },
                },
                completedQuests: {
                  type: "array",
                  description:
                    "유저가 완료한 퀘스트의 배열. 여러 번 완료한 퀘스트의 경우 배열 내에 같은 퀘스트가 여러 번 포함됩니다.",
                  items: {
                    type: "object",
                    required: ["questId", "completedAt"],
                    properties: {
                      questId: {
                        type: "string",
                        description: "퀘스트의 Id",
                        example: "QUEST ID",
                      },
                      completedAt: {
                        type: "string",
                        description: "퀘스트의 완료 시각",
                        example: "2023-01-01 00:00:00",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
globalStateDocs[`${apiPrefix}/create`] = {
  post: {
    tags: [`${apiPrefix}`],
    summary: "Frontend에서 Global State로 관리할 정보 생성",
    description:
      "유저의 재화 개수, 퀘스트 완료 상태 등 Frontend에서 Global State로 관리할 정보를 생성합니다.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/createUserGlobalStateHandler",
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
              required: ["result"],
              properties: {
                result: {
                  type: "boolean",
                  description: "성공 여부. 항상 true입니다.",
                  example: true,
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = globalStateDocs;
