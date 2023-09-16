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
              required: ["transactions"],
              properties: {
                transactions: {
                  type: "array",
                  description: "유저의 재화 입출금 기록의 배열",
                  items: {
                    type: "object",
                    required: ["_id", "type", "amount", "comment", "doneat"],
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
                          "Transaction과 관련된 이벤트의 Id. 이벤트와 관련된 Transaction인 경우에만 포함됩니다.",
                        example: "EVENT ID",
                      },
                      item: {
                        $ref: "#/components/schemas/relatedItem",
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
