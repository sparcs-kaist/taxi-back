const { objectId } = require("@/modules/patterns").default;

const tag = "logininfo";
const apiPrefix = "/logininfo";

const logininfoDocs = {};
logininfoDocs[`${apiPrefix}`] = {
  get: {
    tags: [tag],
    summary: "사용자 정보 반환",
    description: "로그인되어 있는 사용자의 정보를 반환",
    responses: {
      200: {
        description:
          "사용자의 로그인 세션이 유효한 경우, 현재 로그인된 사용자의 정보를 반환, <br/>\n 세션이 유효하지 않은 경우, 빈 오브젝트를 반환",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                oid: {
                  type: "string",
                  pattern: objectId.source,
                },
                id: {
                  type: "string",
                  description: "사용자 id",
                },
                name: {
                  type: "string",
                  description: "사용자 이름",
                },
                nickname: {
                  type: "string",
                },
                withdraw: {
                  type: "boolean",
                },
                phoneNumber: {
                  type: "string",
                  description: "사용자 전화번호",
                },
                badge: {
                  type: "boolean",
                  description: "뱃지 on/off",
                },
                residence: {
                  type: "string",
                  description: "승하차 선호 장소",
                },
                ban: {
                  type: "boolean",
                },
                joinat: {
                  type: "string",
                  format: "date-time",
                },
                agreeOnTermsOfService: {
                  type: "boolean",
                },
                subinfo: {
                  type: "object",
                  properties: {
                    kaist: {
                      type: "string",
                      description: "KAIST 학번(8자리)",
                      minLength: 8,
                      maxLength: 8,
                      example: "20190052",
                    },
                    sparcs: {
                      type: "string",
                    },
                    facebook: {
                      type: "string",
                    },
                    twitter: {
                      type: "string",
                    },
                  },
                },
                email: {
                  type: "string",
                  example: "geon6757@kaist.ac.kr",
                },
                profileImgUrl: {
                  type: "string",
                },
                account: {
                  type: "string",
                },
                deviceToken: {
                  type: "string",
                  description:
                    "클라이언트의 디바이스 토큰, 세션에 저장되어 있지 않은 경우 undefined",
                },
                deviceType: {
                  type: "string",
                  enum: ["web", "app"],
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = logininfoDocs;
