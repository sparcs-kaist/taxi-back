/** Event에 대한 기본적인 프로퍼티를 갖고 있는 스키마입니다. */
const eventBase = {
  type: "object",
  required: [
    "_id",
    "name",
    "rewardAmount",
    "maxCount",
    "expireat",
    "isDisabled",
    "imageUrl",
    "description",
  ],
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
    imageUrl: {
      type: "string",
      description: "이미지 썸네일 URL",
      example: "THUMBNAIL URL",
    },
    description: {
      type: "string",
      description: "이벤트의 설명",
      example: "처음으로 이벤트 기간 중 Taxi에 로그인하면 송편을 드립니다.",
    },
  },
};

const eventsSchema = {
  event: eventBase,
  relatedEvent: {
    ...eventBase,
    description:
      "Transaction과 관련된 이벤트의 Object. 이벤트와 관련된 Transaction인 경우에만 포함됩니다.",
  },
};

module.exports = eventsSchema;
