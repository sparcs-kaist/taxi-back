/* Item에 대한 기본적인 프로퍼티를 갖고 있는 스키마입니다.
 * TODO: 추후 코드 재사용시 상황에 맞춰 zod로 이전이 필요합니다.
 */
const itemBase = {
  type: "object",
  required: [
    "_id",
    "name",
    "imageUrl",
    "price",
    "description",
    "isDisabled",
    "stock",
  ],
  properties: {
    _id: {
      type: "string",
      description: "Item의 ObjectId",
      example: "OBJECT ID",
    },
    name: {
      type: "string",
      description: "상품의 이름",
      example: "진짜송편",
    },
    imageUrl: {
      type: "string",
      description: "이미지 썸네일 URL",
      example: "THUMBNAIL URL",
    },
    instagramStoryStickerImageUrl: {
      type: "string",
      description: "인스타그램 스토리 스티커 이미지 URL",
      example: "STICKER URL",
    },
    price: {
      type: "number",
      description: "상품의 가격. 0 이상입니다.",
      example: 400,
    },
    description: {
      type: "string",
      description: "상품의 설명",
      example: "맛있는 송편입니다.",
    },
    isDisabled: {
      type: "boolean",
      description: "판매 중지 여부",
      example: false,
    },
    stock: {
      type: "number",
      description: "남은 상품 재고. 재고가 있는 경우 1, 없는 경우 0입니다.",
      example: 1,
    },
  },
};

/** itemBase에 itemType(상품 유형) 프로퍼티가 추가된 스키마입니다. */
const itemWithType = {
  type: itemBase.type,
  required: itemBase.required.concat(["itemType"]),
  properties: {
    ...itemBase.properties,
    itemType: {
      type: "number",
      description:
        "상품 유형. 0: 일반 상품, 1: 일반 티켓, 2: 고급 티켓, 3: 랜덤박스입니다.",
      example: 0,
    },
  },
};

const itemsSchema = {
  item: itemWithType,
  relatedItem: {
    ...itemWithType,
    description:
      "Transaction과 관련된 아이템의 Object. 아이템과 관련된 Transaction인 경우에만 포함됩니다.",
  },
  rewardItem: {
    ...itemBase,
    description: "랜덤박스를 구입한 경우에만 포함됩니다.",
  },
  purchaseHandler: {
    type: "object",
    required: ["itemId"],
    properties: {
      itemId: {
        type: "string",
        pattern: "^[a-fA-F\\d]{24}$",
      },
    },
    errorMessage: "validation: bad request",
  },
};

module.exports = itemsSchema;
