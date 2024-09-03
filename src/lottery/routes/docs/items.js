const { eventConfig } = require("../../../../loadenv");
const apiPrefix = `/events/${eventConfig?.mode}/items`;

const itemsDocs = {};
itemsDocs[`${apiPrefix}/`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "상점에서 판매하는 상품의 목록 반환",
    description: "상점에서 판매하는 상품의 목록을 가져옵니다.",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["items"],
              properties: {
                items: {
                  type: "array",
                  description: "상품의 배열",
                  items: {
                    type: "object",
                    required: [
                      "_id",
                      "name",
                      "description",
                      "imageUrl",
                      "price",
                      "isDisabled",
                      "itemType",
                    ],
                    properties: {
                      _id: {
                        type: "string",
                        description: "상품의 ObjectId",
                        example: "ITEM ID",
                      },
                      name: {
                        type: "string",
                        description: "상품의 이름",
                        example: "진짜 송편",
                      },
                      description: {
                        type: "string",
                        description: "상품의 설명",
                        example: "먹을 수 있는 송편입니다.",
                      },
                      imageUrl: {
                        type: "string",
                        description: "상품의 썸네일 이미지 URL",
                        example: "THUMBNAIL URL",
                      },
                      instagramStoryStickerImageUrl: {
                        type: "string",
                        description: "인스타그램 스토리 스티커 이미지 URL",
                        example: "STICKER URL",
                      },
                      price: {
                        type: "number",
                        description: "상품의 가격. 0 이상의 정수입니다.",
                        example: 400,
                      },
                      isDisabled: {
                        type: "boolean",
                        description: "상품의 판매 중지 여부",
                        example: false,
                      },
                      itemType: {
                        type: "number",
                        description:
                          "상품의 유형. 0: 일반 상품, 1: 일반 티켓, 2: 고급 티켓, 3: 랜덤박스입니다.",
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
itemsDocs[`${apiPrefix}/:itemId`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "상점에서 판매하는 특정 상품의 정보 반환",
    description: "상점에서 판매하는 특정 상품의 정보를 가져옵니다.",
    parameters: [
      {
        in: "path",
        name: "itemId",
        required: true,
        description: "상품 정보를 조회할 ObjectId",
        example: "ITEM ID",
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["items"],
              properties: {
                item: {
                  type: "object",
                  description: "상품의 정보",
                  properties: {
                    _id: {
                      type: "string",
                      description: "상품의 ObjectId",
                      example: "ITEM ID",
                    },
                    name: {
                      type: "string",
                      description: "상품의 이름",
                      example: "진짜 송편",
                    },
                    description: {
                      type: "string",
                      description: "상품의 설명",
                      example: "먹을 수 있는 송편입니다.",
                    },
                    imageUrl: {
                      type: "string",
                      description: "상품의 썸네일 이미지 URL",
                      example: "THUMBNAIL URL",
                    },
                    instagramStoryStickerImageUrl: {
                      type: "string",
                      description: "인스타그램 스토리 스티커 이미지 URL",
                      example: "STICKER URL",
                    },
                    price: {
                      type: "number",
                      description: "상품의 가격. 0 이상의 정수입니다.",
                      example: 400,
                    },
                    isDisabled: {
                      type: "boolean",
                      description: "상품의 판매 중지 여부",
                      example: false,
                    },
                    itemType: {
                      type: "number",
                      description:
                        "상품의 유형. 0: 일반 상품, 1: 일반 티켓, 2: 고급 티켓, 3: 랜덤박스입니다.",
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
};
itemsDocs[`${apiPrefix}/leaderboard/{itemId}`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "상품 리더보드 반환",
    description: "상품 리더보드를 가져옵니다. 일반 상품만 리더보드를 갖습니다.",
    parameters: [
      {
        in: "path",
        name: "itemId",
        required: true,
        description: "리더보드를 조회할 상품의 ObjectId",
        example: "ITEM ID",
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["leaderboard", "totalAmount", "totalUser"],
              properties: {
                leaderboard: {
                  type: "array",
                  description: "상품 리더보드. 상위 20등까지만 반환됩니다.",
                  items: {
                    type: "object",
                    required: [
                      "nickname",
                      "profileImageUrl",
                      "amount",
                      "probability",
                    ],
                    properties: {
                      nickname: {
                        type: "string",
                        description: "유저의 닉네임",
                        example: "static",
                      },
                      profileImageUrl: {
                        type: "string",
                        description: "유저의 프로필 이미지 URL",
                        example: "PROFILE URL",
                      },
                      amount: {
                        type: "number",
                        description: "유저가 상품을 구입한 횟수",
                        example: 3,
                      },
                      probability: {
                        type: "number",
                        description: "유저가 상품에 당첨될 확률",
                        example: 0.1,
                      },
                      rank: {
                        type: "number",
                        description: "순위",
                        example: 1,
                      },
                    },
                  },
                },
                totalAmount: {
                  type: "number",
                  description: "상품의 총 판매량",
                  example: 100,
                },
                totalUser: {
                  type: "number",
                  description: "상품을 구입한 유저의 수",
                  example: 50,
                },
                rank: {
                  type: "number",
                  description: "현재 유저의 리더보드 순위. 1부터 시작합니다.",
                  example: 1,
                },
                amount: {
                  type: "number",
                  description: "현재 유저가 상품을 구입한 횟수",
                  example: 3,
                },
                probability: {
                  type: "number",
                  description: "현재 유저가 상품에 당첨될 확률",
                  example: 0.1,
                },
              },
            },
          },
        },
      },
    },
  },
};
itemsDocs[`${apiPrefix}/purchase/{itemId}`] = {
  post: {
    tags: [`${apiPrefix}`],
    summary: "상품 구입",
    description: "상품을 구입합니다.",
    parameters: [
      {
        in: "path",
        name: "itemId",
        required: true,
        description: "리더보드를 조회할 상품의 ObjectId",
        example: "ITEM ID",
      },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/purchaseItemHandlerBody",
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
                isJackpot: {
                  type: "boolean",
                  description:
                    "대박 여부. 랜덤박스를 구입한 경우에만 포함됩니다.",
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

module.exports = itemsDocs;
