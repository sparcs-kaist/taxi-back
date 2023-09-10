const { eventMode } = require("../../../../loadenv");
const apiPrefix = `/events/${eventMode}/transactions`;

const transactionsDocs = {};
transactionsDocs[`${apiPrefix}/`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "재화 입출금 내역 반환",
    description: "유저의 재화 입출금 내역을 가져옵니다.",
    responses: {
      200: {
        description: "",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                transactions: {
                  type: "array",
                  description: "유저의 재화 입출금 기록의 배열",
                  items: {
                    type: "object",
                    properties: {
                      _id: {
                        type: "string",
                        description: "Transaction의 ObjectId",
                        example: "OBJECT ID",
                      },
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
                      eventId: {
                        type: "string",
                        description:
                          "Transaction과 관련된 이벤트의 Object. 이벤트와 관련된 Transaction인 경우에만 포함됩니다.",
                        properties: {
                          _id: {
                            type: "string",
                            description: "Event의 ObjectId",
                            example: "OBJECT ID",
                          },
                          name: {
                            type: "string",
                            description: "이벤트의 이름",
                            example: "최초 로그인 이벤트",
                          },
                          rewardAmount: {
                            type: "number",
                            description: "달성 보상",
                            example: 100,
                          },
                          maxCount: {
                            type: "number",
                            description: "최대 달성 가능 횟수",
                            example: 1,
                          },
                          expireat: {
                            type: "string",
                            description: "달성할 수 있는 마지막 시각",
                            example: "2023-01-01 00:00:00",
                          },
                          isDisabled: {
                            type: "boolean",
                            description: "달성 불가능 여부",
                            example: false,
                          },
                        },
                      },
                      itemId: {
                        type: "object",
                        description:
                          "Transaction과 관련된 아이템의 Object. 아이템과 관련된 Transaction인 경우에만 포함됩니다.",
                        properties: {
                          _id: {
                            type: "string",
                            description: "Item의 ObjectId",
                            example: "OBJECT ID",
                          },
                          name: {
                            type: "string",
                            description: "상품의 이름",
                            example: "랜덤 상자",
                          },
                          imageUrl: {
                            type: "string",
                            description: "이미지 썸네일 URL",
                            example: "THUMBNAIL URL",
                          },
                          price: {
                            type: "number",
                            description: "상품의 가격. 0 이상입니다.",
                            example: 400,
                          },
                          description: {
                            type: "string",
                            description: "상품의 설명",
                            example:
                              "랜덤으로 상품이 나오는 상자입니다. 확률은 다음과 같습니다: 진짜송편 100%, 치킨 0%, ...",
                          },
                          isDisabled: {
                            type: "boolean",
                            description: "판매 중지 여부",
                            example: false,
                          },
                          stock: {
                            type: "number",
                            description: "남은 상품 재고. 0 이상입니다.",
                            example: 10,
                          },
                          itemType: {
                            type: "number",
                            description:
                              "아이템 유형. 0: 티켓아님, 1:티켓 타입1, 2: 티켓 타입 2, 3: 랜덤박스",
                            example: 0,
                          },
                        },
                      },
                      comment: {
                        type: "string",
                        description: "입출금 내역에 대한 설명",
                        example: "랜덤 상자 구입 - 50개 차감",
                      },
                      doneat: {
                        type: "string",
                        description: "입출금이 일어난 시각",
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
