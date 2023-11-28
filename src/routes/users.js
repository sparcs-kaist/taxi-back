const express = require("express");
const { body } = require("express-validator");
const validator = require("@/middlewares/validator");
const patterns = require("@/modules/patterns");

const router = express.Router();
const userHandlers = require("@/services/users");

const { replaceSpaceInNickname } = require("@/modules/modifyProfile");

// 라우터 접근 시 로그인 필요
router.use(require("@/middlewares/auth"));

// 이용 약관에 동의합니다.
router.post(
  "/agreeOnTermsOfService",
  userHandlers.agreeOnTermsOfServiceHandler
);
router.get(
  "/getAgreeOnTermsOfService",
  userHandlers.getAgreeOnTermsOfServiceHandler
);

// 새 닉네임을 받아 로그인된 유저의 닉네임을 변경합니다.
router.post(
  "/editNickname",
  body("nickname")
    .customSanitizer(replaceSpaceInNickname)
    .matches(patterns.user.nickname),
  validator,
  userHandlers.editNicknameHandler
);

// 넥네임을 기본값으로 재설정합니다.
router.get("/resetNickname", userHandlers.resetNicknameHandler);

// 새 계좌번호를 받아 로그인된 유저의 계좌번호를 변경합니다.
router.post(
  "/editAccount",
  body("account").matches(patterns.user.account),
  validator,
  userHandlers.editAccountHandler
);

// 프로필 이미지를 업로드할 수 있는 Presigned-url을 발급합니다.
router.post(
  "/editProfileImg/getPUrl",
  body("type").matches(patterns.user.profileImgType),
  validator,
  userHandlers.editProfileImgGetPUrlHandler
);

// 프로필 이미지가 S3에 정상적으로 업로드가 되었는지 확인합니다.
router.get("/editProfileImg/done", userHandlers.editProfileImgDoneHandler);

// 프로필 이미지를 기본값으로 재설정합니다.
router.get("/resetProfileImg", userHandlers.resetProfileImgHandler);

module.exports = router;
