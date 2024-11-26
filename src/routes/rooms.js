const express = require("express");
const { query, body } = require("express-validator");
const { validateBody } = require("../middlewares/zod");
const { roomsZod } = require("./docs/schemas/roomsSchema");
const router = express.Router();

const roomHandlers = require("@/services/rooms");
const validator = require("@/middlewares/validator").default;
const patterns = require("@/modules/patterns").default;

// 조건(이름, 출발지, 도착지, 날짜)에 맞는 방들을 모두 반환한다.
router.get(
  "/search",
  [
    query("name").optional().matches(patterns.room.name),
    query("from").optional().isMongoId(),
    query("to").optional().isMongoId(),
    query("time").optional().isISO8601(),
    query("withTime").toBoolean().optional().isBoolean(),
    query("maxPartLength").optional().isInt({ min: 2, max: 4 }),
    query("isHome").toBoolean().isBoolean(),
  ],
  validator,
  roomHandlers.searchHandler
);

// 특정 id 방의 정산 정보를 제외한 세부사항을 반환한다.
router.get(
  "/publicInfo",
  query("id").isMongoId(),
  validator,
  roomHandlers.publicInfoHandler
);

// 이후 API 접근 시 로그인 필요
router.use(require("@/middlewares/auth").default);

// 방 생성/참여전 ban 여부 확인
router.use(require("@/middlewares/ban").default);

// 특정 id 방 세부사항 보기
router.get(
  "/info",
  query("id").isMongoId(),
  validator,
  roomHandlers.infoHandler
);

// JSON으로 받은 정보로 방을 생성한다.
router.post(
  "/create",
  [
    body("name").matches(patterns.room.name),
    body("from").isMongoId(),
    body("to").isMongoId(),
    body("time").isISO8601(),
    body("maxPartLength").isInt({ min: 2, max: 4 }),
  ],
  validator,
  roomHandlers.createHandler
);

// 방을 생성하기 전, 생성하고자 하는 방이 실제로 택시 탑승의 목적성을 갖고 있는지 예측한다.
router.post(
  "/create/test",
  [
    body("from").isMongoId(),
    body("to").isMongoId(),
    body("time").isISO8601(),
    body("maxPartLength").isInt({ min: 2, max: 4 }),
  ],
  validator,
  roomHandlers.createTestHandler
);

// 새로운 사용자를 방에 참여시킨다.
// FIXME: req.body.users 검증할 때 SSO ID 규칙 반영하기
router.post(
  "/join",
  [body("roomId").isMongoId()],
  validator,
  roomHandlers.joinHandler
);

// 기존 방에서 나간다. (채팅 이벤트 연동 안됨: 방 주인이 바뀌는 경우.)
// request: {roomId: 나갈 방}
// result: Room
// 모든 사람이 나갈 경우에도 방을 삭제하지 않는다.
router.post(
  "/abort",
  body("roomId").isMongoId(),
  validator,
  roomHandlers.abortHandler
);

// 로그인된 사용자의 모든 방들을 반환한다.
router.get("/searchByUser", roomHandlers.searchByUserHandler);

// 해당 방에 요청을 보낸 유저의 정산을 처리한다.
router.post(
  "/commitSettlement",
  validateBody(roomsZod.commitSettlement),
  roomHandlers.commitSettlementHandler
);

// 해당 방에 요청을 보낸 유저의 송금을 처리한다.
router.post(
  "/commitPayment",
  validateBody(roomsZod.commitPayment),
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

module.exports = router;
