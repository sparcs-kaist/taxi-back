const tag = "users";
const apiPrefix = "/users";
const { objectId } = require("../../modules/patterns").default;

const usersDocs = {};
usersDocs[`${apiPrefix}/agreeOnTermsOfService`] = {
  post: {
    tags: [tag],
    summary: "이용 약관에 동의",
    description:
      "요청을 보낸 유저의 약관 동의 여부를 동의함으로 변경합니다. 철회는 불가능합니다.",
    responses: {
      200: {
        content: {
          "text/html": {
            example:
              "Users/agreeOnTermsOfService : agree on Terms of Service successful",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Users/agreeOnTermsOfService : already agreed",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Users/agreeOnTermsOfService : internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/getAgreeOnTermsOfService`] = {
  get: {
    tags: [tag],
    summary: "이용 약관 동의 여부 전송",
    description:
      "요청을 보낸 유저의 이용 약관 동의 여부를 json 형태로 전송합니다.",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                agreeOnTermsOfService: {
                  type: "boolean",
                  description: "유저의 이용 약관 동의 여부",
                  example: true,
                },
              },
            },
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Users/getAgreeOnTermsOfService : internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/editNickname`] = {
  post: {
    tags: [tag],
    summary: "유저의 닉네임 변경",
    description: "유저의 닉네임을 요청한 닉네임으로 변경합니다.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              nickname: {
                type: "string",
                example: "끈질긴 열과 분자의 이동",
                description: "유저의 새 닉네임",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "text/html": {
            example: "Users/editNickname : edit user nickname successful",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Users/editNickname : such user id does not exist",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Users/editNickname : internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/resetNickname`] = {
  get: {
    tags: [tag],
    summary: "유저 닉네임 기본값으로 재설정",
    description: "유저의 별명을 기본값(랜덤한 닉네임)으로 초기화합니다",
    responses: {
      200: {
        content: {
          "text/html": {
            example: "Users/resetNickname : reset user nickname successful",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Users/resetNickname : such user does not exist",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Users/resetNickname : internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/editAccount`] = {
  post: {
    tags: [tag],
    summary: "유저의 계좌 번호 변경",
    description: "유저의 계좌 번호를 요청한 계좌 번호로 변경합니다.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              account: {
                type: "string",
                description: "유저의 새 계좌 번호",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "text/html": {
            example: "Users/editAccount : edit user account successful",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Users/editAccount : such user id does not exist",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Users/editAccount : internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/registerPhoneNumber`] = {
  post: {
    tags: [tag],
    summary: "유저의 전화 번호 등록",
    description: "유저의 전화 번호를 요청한 전화 번호로 등록합니다.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              phoneNumber: {
                type: "string",
                description: "유저의 전화 번호",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "text/html": {
            example:
              "Users/registerPhoneNumber : create user phoneNumber successful",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Users/registerPhoneNumber : such user id does not exist",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Users/registerPhoneNumber : internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/editBadge`] = {
  post: {
    tags: [tag],
    summary: "유저의 뱃지 적용 상태 변경",
    description: "유저의 뱃지를 탈부착합니다.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              badge: {
                type: "string",
                description: "뱃지 상태",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "text/html": {
            example: "Users/editBadge : badge successfully applied",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Users/editBadge : invalid request for badge",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Users/editBadge : Unauthorized user",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Users/editBadge : internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/registerResidence`] = {
  post: {
    tags: [tag],
    summary: "유저의 승하차 선호 장소 등록",
    description: "유저의 승하차 선호 장소를 등록합니다.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              residence: {
                type: "string",
                description: "유저의 승하차 선호 장소",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "text/html": {
            example:
              "Users/registerResidence: residenceInfo registered successfully",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Users/registerResidence: user not found or update failed",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Users/registerResidence: internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/deleteResidence`] = {
  post: {
    tags: [tag],
    summary: "유저의 승하차 선호 장소 정보 삭제",
    description: "유저의 승하차 선호 장소 정보를 삭제합니다.",
    responses: {
      200: {
        content: {
          "text/html": {
            example:
              "Users/deleteResidence: residenceInfo deleted successfully",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Users/deleteResidence: user not found or update failed",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Users/deleteResidence: internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/editProfileImg/getPUrl`] = {
  post: {
    tags: [tag],
    summary: "프로필 이미지 업로드를 위한 presigned-url 발급",
    description: `유저의 프로필 이미지는 AWS S3에서 관리됩니다. 변경할 프로필을 업로드 하기 위한 주소인 presigned-url을 발급합니다.<br/>
    <br/>
    **프로필 사진은 아래 규칙을 만족해야 합니다:**<br/> 
    1. 파일 형식은 image/png, image/jpg, image/jpeg 중 하나<br/>
    2. 파일 크기는 최대 50 MB`,
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              type: {
                type: "string",
                description: "업로드할 이미지 type",
                example: "image/png",
              },
            },
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
              properties: {
                url: {
                  type: "string",
                  description: "이미지 업로드를 위한 presigned-url",
                },
                fields: {
                  type: "object",
                  properties: {
                    "Content-Type": {
                      type: "string",
                      description: "이미지의 type",
                    },
                    key: {
                      type: "string",
                      description: "이미지의 S3 파일 경로",
                    },
                  },
                  description: "업로드 파일의 type 및 key 정보",
                },
              },
            },
          },
        },
      },
      500: {
        contnet: {
          "text/html": {
            example: "Users/editProfileImg/getPUrl : internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/editProfileImg/done`] = {
  get: {
    tags: [tag],
    summary: "프로필 이미지 정상 업로드 여부 확인",
    description: `프로필 이미지가 S3에 정상적으로 업로드 되었는지 확인합니다.<br/>
    정상적으로 확인 되었다면, 유저의 \`profileImageUrl\` 정보를 새 프로필 이미지 파일명으로 업데이트 합니다.`,
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                result: {
                  type: "boolean",
                  description: "정상적인 업로드 성공 여부",
                },
                profileImageUrl: {
                  type: "string",
                  description:
                    "새 프로필 이미지 파일명 (업로드 실패 시 `undefined`)",
                },
              },
            },
          },
        },
      },
      500: {
        contnet: {
          "text/html": {
            example: "Users/editProfileImg/done : internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/resetProfileImg`] = {
  get: {
    tags: [tag],
    summary: "유저 프로필 사진 기본값으로 재설정",
    description: "유저의 프로필 사진을 기본값(랜덤한 사진)으로 초기화합니다",
    responses: {
      200: {
        content: {
          "text/html": {
            example:
              "Users/resetProfileImg : reset user profile image successful",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Users/resetProfileImg : such user does not exist",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Users/resetProfileImg : internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/getBanRecord`] = {
  get: {
    tags: [tag],
    summary: "본인의 현재 정지 기록을 가져움",
    description:
      "정지 기록들 중 본인이고, 서버 시간을 기준으로 expireAt 보다 작은 경우에 해당하는 정지 기록을 모두 가져옴",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                properties: {
                  userSid: {
                    type: "string",
                    description: "사용자의 SSO ID",
                    pattern: "monday-sid",
                  },
                  reason: {
                    type: "string",
                    description: "정지 사유",
                    example: "미정산",
                  },
                  bannedAt: {
                    type: "date",
                    description: "정지 당한 시각",
                    example: "2024-05-20 12:00",
                  },
                  expireAt: {
                    type: "date",
                    description: "정지 만료 시각",
                    example: "2024-05-21 12:00",
                  },
                  serviceName: {
                    type: "string",
                    description: "정지를 당한 서비스 또는 이벤트 이름",
                    example: "2023-fall-event",
                  },
                },
              },
            },
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Users/getBanRecord : there is no ban record",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Users/getBanRecord : internal server error",
          },
        },
      },
    },
  },
};

usersDocs[`${apiPrefix}/withdraw`] = {
  post: {
    tags: [tag],
    summary: "회원 탈퇴",
    description: "회원 탈퇴를 요청합니다.",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ssoLogoutUrl: {
                  type: "string",
                  description: "SSO 로그아웃 URL",
                },
              },
            },
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Users/withdraw : ongoing room exists",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Users/withdraw : internal server error",
          },
        },
      },
    },
  },
};

module.exports = usersDocs;
