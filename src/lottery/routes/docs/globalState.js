const { eventMode } = require("../../../../loadenv");
const apiPrefix = `/events/${eventMode}/global-state`;

const globalStateDocs = {};
globalStateDocs[`${apiPrefix}/`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "Frontend에서 Global state로 관리하는 정보 반환",
    description:
      "유저의 재화 개수, 이벤트 달성 상태, 추첨권 개수 등 Frontend에서 Global state로 관리할 정보를 가져옵니다. 유저에 대한 EventStatus Document가 없을 경우 새롭게 생성하며, 유일한 생성 지점입니다.",
    responses: {
      200: {
        description: "",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "creditAmount",
                "eventStatus",
                "ticket1Amount",
                "ticket2Amount",
                "events",
              ],
              properties: {
                creditAmount: {
                  type: "number",
                  description: "재화 개수. 0 이상입니다.",
                  example: 10000,
                },
                eventStatus: {
                  type: "array",
                  description:
                    "유저가 달성한 이벤트의 배열. 여러 번 달성할 수 있는 이벤트의 경우 배열 내에 같은 이벤트가 여러 번 포함될 수 있습니다.",
                  items: {
                    type: "string",
                    description: "Event의 ObjectId",
                    example: "OBJECT ID",
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
                events: {
                  type: "array",
                  description: "Event의 배열",
                  items: {
                    type: "object",
                    required: [
                      "id",
                      "name",
                      "description",
                      "imageUrl",
                      "rewardAmount",
                      "maxCount",
                    ],
                    properties: {
                      id: {
                        type: "string",
                        description: "Event의 Id",
                        example: "EVENT ID",
                      },
                      name: {
                        type: "string",
                        description: "이벤트의 이름",
                        example: "최초 로그인 이벤트",
                      },
                      description: {
                        type: "string",
                        description: "이벤트의 설명",
                        example:
                          "처음으로 이벤트 기간 중 Taxi에 로그인하면 송편을 드립니다.",
                      },
                      imageUrl: {
                        type: "string",
                        description: "이미지 썸네일 URL",
                        example: "THUMBNAIL URL",
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

module.exports = globalStateDocs;
