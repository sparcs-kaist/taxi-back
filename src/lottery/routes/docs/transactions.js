const { eventConfig } = require("../../../../loadenv");
const apiPrefix = `/events/${eventConfig?.mode}/transactions`;

const transactionsDocs = {};
transactionsDocs[`${apiPrefix}/`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "재화 입출금 내역 반환",
    description: "재화 입출금 내역을 가져옵니다.",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["transactions"],
              properties: {
                transactions: {
                  type: "array",
                  description: "유저의 재화 입출금 내역의 배열",
                  items: {
                    type: "object",
                    required: ["type", "amount", "comment", "createdAt"],
                    properties: {
                      type: {
                        type: "string",
                        description:
                          "재화의 입금 또는 출금 여부. get 또는 use 중 하나입니다.",
                        example: "use",
                      },
                      amount: {
                        type: "number",
                        description: "재화의 변화량의 절댓값",
                        example: 50,
                      },
                      questId: {
                        type: "string",
                        description: "입출금 내역과 관련된 퀘스트의 Id",
                        example: "QUEST ID",
                      },
                      item: {
                        type: "object",
                        required: ["name", "imageUrl"],
                        properties: {
                          name: {
                            type: "string",
                            description: "상품의 이름",
                            example: "랜덤 상자",
                          },
                          imageUrl: {
                            type: "string",
                            description: "상품의 썸네일 이미지 URL",
                            example: "IMAGE URL",
                          },
                        },
                      },
                      comment: {
                        type: "string",
                        description: "입출금 내역에 대한 설명",
                        example: "랜덤 상자 구입 - 50개 차감",
                      },
                      createdAt: {
                        type: "string",
                        description: "입출금 내역이 생성된 시각",
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

module.exports = transactionsDocs;
