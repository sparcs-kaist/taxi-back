const express = require("express");
const { body } = require("express-validator");
const validator = require("../middleware/validator");
const patterns = require("../db/patterns");

const router = express.Router();
const chatsHandlers = require("../service/chats");

// 라우터 접근 시 로그인 필요
router.use(require("../middleware/auth"));

// 채팅 이미지를 업로드할 수 있는 Presigned-url을 발급합니다.
router.post(
  "/uploadChatImg/getPUrl",
  body("type").matches(patterns.chat.chatImgType),
  validator,
  chatsHandlers.uploadChatImgGetPUrlHandler
);

// 채팅 이미지가 S3에 정상적으로 업로드가 되었는지 확인합니다.
router.post(
  "/uploadChatImg/done",
  body("id").isMongoId(),
  validator,
  chatsHandlers.uploadChatImgDoneHandler
);

module.exports = router;
