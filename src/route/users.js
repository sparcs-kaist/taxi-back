const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validator = require("../middleware/validator");
const authMiddleware = require("../middleware/auth");
const uploadProfileImage = require("../middleware/uploadProfileImage");

const userHandlers = require("../service/users");

// 라우터 접근 시 로그인 필요
router.use(authMiddleware);

// 입력 데이터 검증을 위한 정규 표현식들
const patterns = {
  nickname: RegExp("^[A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ0-9-_ ]{3,25}$"),
};

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
// 닉네임은 알파벳, 한글, 숫자, 공백, "-", ",", "_" 기호만을 이용해 3~25자 길이로 구성되어야 합니다.
router.post(
  "/editNickname",
  body("nickname").matches(patterns.nickname),
  validator,
  userHandlers.editNicknameHandler
);

// multipart form으로 프로필 사진을 업로드 받아 변경합니다.
router.post(
  "/uploadProfileImage",
  uploadProfileImage,
  userHandlers.uploadProfileImageHandler
);

// 아래 라우트 메서드들은 테스트 용도로만 사용 가능
/* GET users listing. */
router.get("/", userHandlers.listAllUsersHandler);

router.get("/rooms", userHandlers.listRoomsOfUserHandler);

router.get("/:id", userHandlers.idHandler);

// json으로 수정할 값들을 받는다
// replace/overwrite all user informations with given JSON
router.post("/:id/edit", userHandlers.idEditHandler);

// 409 Conflict
// This response is sent when a request conflicts with the current state of the server.
router.get("/:id/ban", userHandlers.idBanHandler);

router.get("/:id/unban", userHandlers.idUnbanHandler);

// Request JSON form
// { room : [ObjectID] }
router.post("/:id/participate", userHandlers.idParticipateHandler);

module.exports = router;
