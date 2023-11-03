const tag = "locations";
const apiPrefix = "/locations";

const locationsDocs = {};
locationsDocs[`${apiPrefix}`] = {
  get: {
    tags: [tag],
    summary: "출발지/도착지 정보 반환",
    description:
      "출발지/도착지로 사용 가능한 장소 목록 조회 및 요청 처리 당시 서버 시각 반환 <br/>\n       (로그인된 상태에서만 접근 가능)",
    responses: {
      200: {
        description: "서버에 저장된 location이 없을 경우, locations은 빈 배열",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                locations: {
                  type: "array",
                  description: "출발지/도착지로 사용 가능한 장소 목록",
                  items: {
                    type: "object",
                    properties: {
                      priority: {
                        type: "number",
                      },
                      isValid: {
                        type: "boolean",
                      },
                      _id: {
                        type: "string",
                      },
                      koName: {
                        type: "string",
                        description: "장소의 한국어 명칭",
                        example: "택시승강장",
                      },
                      enName: {
                        type: "string",
                        description: "장소의 영어 명칭",
                        example: "Taxi Stand",
                      },
                    },
                  },
                },
                serverTime: {
                  type: "string",
                  format: "date-time",
                  description: "요청 처리 당시 서버 시각",
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = locationsDocs;
