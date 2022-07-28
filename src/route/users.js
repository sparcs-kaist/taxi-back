const express = require("express");
const { body } = require("express-validator");
const validator = require("../middleware/validator");
const patterns = require("../db/patterns");

const router = express.Router();
const userHandlers = require("../service/users");

// 라우터 접근 시 로그인 필요
router.use(require("../middleware/auth"));
router.use(require("../middleware/apiAccessLog"));

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
  body("nickname").matches(patterns.user.nickname),
  validator,
  userHandlers.editNicknameHandler
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
