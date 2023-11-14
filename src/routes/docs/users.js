const tag = "users";
const apiPrefix = "/users";

const usersDocs = {};
usersDocs[`${apiPrefix}/resetNickname`] = {
  get: {
    tags: [tag],
    summary: "유저 닉네임 기본값으로 재설정",
    description: "유저의 별명을 기본값(랜덤한 닉네임)으로 초기화합니다",
    responses: {
      200: {
        content: {
          "text/html": {
            example: "User/resetNickname : reset user nickname successful",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "User/resetNickname : such user does not exist",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "User/resetNickname : internal server error",
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
              "User/resetProfileImg : reset user profile image successful",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "User/resetProfileImg : such user does not exist",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "User/resetProfileImg : internal server error",
          },
        },
      },
    },
  },
};

module.exports = usersDocs;
