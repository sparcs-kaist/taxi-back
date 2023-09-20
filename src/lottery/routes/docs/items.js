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
    },
  },
};
itemsDocs[`${apiPrefix}/purchase/:itemId`] = {
  post: {
    tags: [`${apiPrefix}`],
    summary: "상품 구매",
    description: "상품을 구매합니다.",
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
    },
  },
};

module.exports = itemsDocs;
