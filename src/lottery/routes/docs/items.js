const { eventMode } = require("../../../../loadenv");
const apiPrefix = `/events/${eventMode}/items`;

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
              properties: {
                items: {
                  type: "array",
                  description: "Item의 배열",
                  items: {
                    type: "object",
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
