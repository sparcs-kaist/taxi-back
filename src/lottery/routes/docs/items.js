const { eventConfig } = require("../../../../loadenv");
const apiPrefix = `/events/${eventConfig.mode}/items`;

const itemsDocs = {};
itemsDocs[`${apiPrefix}/list`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "상점에서 판매하는 모든 상품의 목록 반환",
    description:
      "상점에서 판매하는 모든 상품의 목록을 가져옵니다. 매진된 상품도 가져옵니다.",
    responses: {
      200: {
        description: "",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["items"],
              properties: {
                items: {
                  type: "array",
                  description: "Item의 배열",
                  items: {
                    $ref: "#/components/schemas/item",
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description:
          "해당 유저 제재 대상 여부checkBanned에서 이벤트에 동의하지 않은 사람과 제재 대상을 선별합니다.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                  description: "",
                  example: "checkBanned: banned user",
                },
              },
            },
          },
        },
      },
    },
  },
};
itemsDocs[`${apiPrefix}/purchase/:itemId`] = {
  post: {
    tags: [`${apiPrefix}`],
    summary: "상품 구매",
    description: "상품을 구매합니다.",
    requestBody: {
      description: "",
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/purchaseHandler",
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
              required: ["result"],
              properties: {
                result: {
                  type: "boolean",
                  description: "성공 여부. 항상 true입니다.",
                  example: true,
                },
                reward: {
                  $ref: "#/components/schemas/rewardItem",
                },
              },
            },
          },
        },
      },
      400: {
        description:
          "checkBanned에서 이벤트에 동의하지 않은 사람과 제재 대상을 선별합니다.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                  description: "",
                  example: "checkBanned: banned user",
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = itemsDocs;
