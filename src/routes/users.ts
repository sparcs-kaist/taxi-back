import express from "express";
import { body } from "express-validator";
import { authMiddleware, validatorMiddleware } from "@/middlewares";
import patterns from "@/modules/patterns";

const router = express.Router();
import * as userHandlers from "@/services/users";

import { replaceSpaceInNickname } from "@/modules/modifyProfile";

// 라우터 접근 시 로그인 필요
router.use(authMiddleware);

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
  validatorMiddleware,
  userHandlers.editNicknameHandler
);

// 넥네임을 기본값으로 재설정합니다.
router.get("/resetNickname", userHandlers.resetNicknameHandler);

// 새 계좌번호를 받아 로그인된 유저의 계좌번호를 변경합니다.
router.post(
  "/editAccount",
  body("account").matches(patterns.user.account),
  validatorMiddleware,
  userHandlers.editAccountHandler
);

// 새 전화번호를 받아 로그인된 유저의 전화번호를 저장합니다.
router.post(
  "/registerPhoneNumber",
  body("phoneNumber").matches(patterns.user.phoneNumber),
  validatorMiddleware,
  userHandlers.registerPhoneNumberHandler
);

// 뱃지를 부여하거나 회수합니다.
router.post("/editBadge", userHandlers.editBadgeHandler);

// 거주지 정보를 등록합니다.
router.post(
  "/registerResidence",
  body("residence"),
  validatorMiddleware,
  userHandlers.registerResidenceHandler
);

// 거주지 정보를 삭제합니다.
router.post("/deleteResidence", userHandlers.deleteResidenceHandler);

// 프로필 이미지를 업로드할 수 있는 Presigned-url을 발급합니다.
router.post(
  "/editProfileImg/getPUrl",
  body("type").matches(patterns.user.profileImgType),
  validatorMiddleware,
  userHandlers.editProfileImgGetPUrlHandler
);

// 프로필 이미지가 S3에 정상적으로 업로드가 되었는지 확인합니다.
router.get("/editProfileImg/done", userHandlers.editProfileImgDoneHandler);

// 프로필 이미지를 기본값으로 재설정합니다.
router.get("/resetProfileImg", userHandlers.resetProfileImgHandler);

// 유저의 서비스 정지 기록들을 모두 반환합니다.
router.get("/getBanRecord", userHandlers.getBanRecordHandler);

// 회원 탈퇴를 요청합니다.
router.post("/withdraw", validatorMiddleware, userHandlers.withdrawHandler);

export default router;
