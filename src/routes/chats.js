const express = require("express");
const { body } = require("express-validator");
const validator = require("@/middlewares/validator").default;
const patterns = require("@/modules/patterns").default;
const { validateBody } = require("@/middlewares/zod");
const { chatsZod } = require("./docs/schemas/chatsSchema");

const router = express.Router();
const chatsHandlers = require("@/services/chats");

// 라우터 접근 시 로그인 필요
router.use(require("@/middlewares/auth").default);

/**
 * 가장 최근에 도착한 60개의 채팅을 가져옵니다.
 */
router.post(
  "/",
  body("roomId").isMongoId(),
  validator,
  chatsHandlers.loadRecentChatHandler
);

/**
 * lastMsgDate 이전에 도착한 60개의 채팅을 가져옵니다.
 */
router.post(
  "/load/before",
  body("roomId").isMongoId(),
  body("lastMsgDate").isISO8601(),
  validator,
  chatsHandlers.loadBeforeChatHandler
);

/**
 * lastMsgDate 이후에 도착한 60개의 채팅을 가져옵니다.
 */
router.post(
  "/load/after",
  body("roomId").isMongoId(),
  body("lastMsgDate").isISO8601(),
  validator,
  chatsHandlers.loadAfterChatHandler
);

/**
 * 채팅 요청을 처리합니다.
 * 같은 방에 있는 user들에게 이 채팅을 전송합니다.
 */
router.post(
  "/send",
  validateBody(chatsZod.sendChatHandler),
  chatsHandlers.sendChatHandler
);

/**
 * 채팅 읽은 시각 업데이트 요청을 처리합니다.
 * 같은 방에 있는 user들에게 업데이트를 요청합니다.
 */
router.post(
  "/read",
  body("roomId").isMongoId(),
  validator,
  chatsHandlers.readChatHandler
);

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
