const tag = "users";
const apiPrefix = "/users";

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

module.exports = usersDocs;
