import express from "express";
import { validateBody } from "@/middlewares";
import { chatsZod } from "./docs/schemas/chatsSchema";

import * as chatsHandlers from "@/services/chats";

const router = express.Router();

// 라우터 접근 시 로그인 필요
router.use(require("@/middlewares/auth").default);

/**
 * 가장 최근에 도착한 60개의 채팅을 가져옵니다.
 */
router.post(
  "/",
  validateBody(chatsZod.loadRecentChatHandler),
  chatsHandlers.loadRecentChatHandler
);

/**
 * lastMsgDate 이전에 도착한 60개의 채팅을 가져옵니다.
 */
router.post(
  "/load/before",
  validateBody(chatsZod.loadBeforeChatHandler),
  chatsHandlers.loadBeforeChatHandler
);

/**
 * lastMsgDate 이후에 도착한 60개의 채팅을 가져옵니다.
 */
router.post(
  "/load/after",
  validateBody(chatsZod.loadAfterChatHandler),
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
  validateBody(chatsZod.readChatHandler),
  chatsHandlers.readChatHandler
);

// 채팅 이미지를 업로드할 수 있는 Presigned-url을 발급합니다.
router.post(
  "/uploadChatImg/getPUrl",
  validateBody(chatsZod.uploadChatImgGetPUrlHandler),
  chatsHandlers.uploadChatImgGetPUrlHandler
);

// 채팅 이미지가 S3에 정상적으로 업로드가 되었는지 확인합니다.
router.post(
  "/uploadChatImg/done",
  validateBody(chatsZod.uploadChatImgDoneHandler),
  chatsHandlers.uploadChatImgDoneHandler
);

export default router;
