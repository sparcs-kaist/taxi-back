const { eventMode } = require("../../../../loadenv");
const apiPrefix = `/events/${eventMode}/global-state`;

const globalStateDocs = {};
globalStateDocs[`${apiPrefix}/`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "Frontend에서 Global state로 관리하는 정보 반환",
    description:
      "유저의 재화 개수, 퀘스트 완료 상태 등 Frontend에서 Global state로 관리할 정보를 가져옵니다.",
    responses: {
      200: {
        description: "",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "creditAmount",
                "completedQuests",
                "ticket1Amount",
                "ticket2Amount",
                "quests",
              ],
              properties: {
                creditAmount: {
                  type: "number",
                  description: "재화 개수. 0 이상입니다.",
                  example: 10000,
                },
                completedQuests: {
                  type: "array",
                  description:
                    "유저가 완료한 퀘스트의 배열. 여러 번 완료할 수 있는 퀘스트의 경우 배열 내에 같은 퀘스트가 여러 번 포함됩니다.",
                  items: {
                    type: "string",
                    description: "Quest의 Id",
                    example: "QUEST ID",
                  },
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
                quests: {
                  type: "array",
                  description: "Quest의 배열",
                  items: {
                    type: "object",
                    required: [
                      "id",
                      "name",
                      "description",
                      "imageUrl",
                      "reward",
                      "maxCount",
                    ],
                    properties: {
                      id: {
                        type: "string",
                        description: "Quest의 Id",
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
                        description: "이미지 썸네일 URL",
                        example: "THUMBNAIL URL",
                      },
                      reward: {
                        type: "object",
                        description: "완료 보상",
                        required: ["credit", "ticket1"],
                        properties: {
                          credit: {
                            type: "number",
                            description: "완료 보상 중 재화의 개수입니다.",
                            example: 100,
                          },
                          ticket1: {
                            type: "number",
                            description: "완료 보상 중 일반 티켓의 개수입니다.",
                            example: 1,
                          },
                        },
                      },
                      maxCount: {
                        type: "number",
                        description: "최대 완료 가능 횟수",
                        example: 1,
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
  get: {
    tags: [`${apiPrefix}`],
    summary: "Frontend에서 Global state로 관리하는 정보 생성",
    description:
      "유저의 재화 개수, 퀘스트 완료 상태 등 Frontend에서 Global state로 관리할 정보를 생성합니다.",
    responses: {
      200: {
        description: "",
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
