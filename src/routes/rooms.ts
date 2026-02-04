import express from "express";
import { roomsZod } from "./docs/schemas/roomsSchema";
import * as roomHandlers from "@/services/rooms";
import { authMiddleware, validateBody, validateQuery } from "@/middlewares";

const router = express.Router();

// 조건(이름, 출발지, 도착지, 날짜)에 맞는 방들을 모두 반환한다.
router.get(
  "/search",
  validateQuery(roomsZod.searchHandler),
  roomHandlers.searchHandler
);

router.get(
  "/searchByTimeGap",
  validateQuery(roomsZod.searchByTimeGapHandler),
  roomHandlers.searchByTimeGapHandler
);

// 특정 id 방의 정산 정보를 제외한 세부사항을 반환한다.
router.get(
  "/publicInfo",
  validateQuery(roomsZod.publicInfoHandler),
  roomHandlers.publicInfoHandler
);

// 이후 API 접근 시 로그인 필요
router.use(authMiddleware);

// 특정 id 방 세부사항 보기
router.get(
  "/info",
  validateQuery(roomsZod.infoHandler),
  roomHandlers.infoHandler
);

// JSON으로 받은 정보로 방을 생성한다.
router.post(
  "/create",
  validateBody(roomsZod.createHandler),
  roomHandlers.createHandler
);

// 방을 생성하기 전, 생성하고자 하는 방이 실제로 택시 탑승의 목적성을 갖고 있는지 예측한다.
router.post(
  "/create/test",
  validateBody(roomsZod.createTestHandler),
  roomHandlers.createTestHandler
);

// 새로운 사용자를 방에 참여시킨다.
// FIXME: req.body.users 검증할 때 SSO ID 규칙 반영하기
router.post(
  "/join",
  validateBody(roomsZod.joinHandler),
  roomHandlers.joinHandler
);

// 기존 방에서 나간다. (채팅 이벤트 연동 안됨: 방 주인이 바뀌는 경우.)
// request: {roomId: 나갈 방}
// result: Room
// 모든 사람이 나갈 경우에도 방을 삭제하지 않는다.
router.post(
  "/abort",
  validateBody(roomsZod.abortHandler),
  roomHandlers.abortHandler
);

// 로그인된 사용자의 모든 방들을 반환한다.
router.get("/searchByUser", roomHandlers.searchByUserHandler);

// 해당 방에 요청을 보낸 유저의 정산을 처리한다.
router.post(
  "/commitSettlement",
  validateBody(roomsZod.commitSettlementHandler),
  roomHandlers.commitSettlementHandler
);

// 해당 방에 요청을 보낸 유저의 송금을 처리한다.
router.post(
  "/commitPayment",
  validateBody(roomsZod.commitPaymentHandler),
  roomHandlers.commitPaymentHandler
);

// json으로 수정할 값들을 받아 방의 정보를 수정합니다.
// request JSON
// roomId, name, from, to, time
/**
 * @todo Unused -> Maybe used in the future?
 */
// router.patch(
//   "/edit",
//   [
//     body("roomId").isMongoId(),
//     body("name").optional().matches(patterns.room.name),
//     body("from").optional().isMongoId(),
//     body("to").optional().isMongoId(),
//     body("time").optional().isISO8601(),
//     body("maxPartLength").optional().isInt({ min: 2, max: 4 }),
//   ],
//   validator,
//   roomHandlers.editHandler
// );

export default router;
