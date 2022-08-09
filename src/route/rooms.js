const express = require("express");
const { query, param, body } = require("express-validator");
const setTimestamp = require("../middleware/setTimestamp");
const validator = require("../middleware/validator");
const patterns = require("../db/patterns");

const router = express.Router();
const roomHandlers = require("../service/rooms");

// 라우터 접근 시 로그인 필요
router.use(require("../middleware/auth"));

// 특정 id 방 세부사항 보기
router.get(
  "/:id/info",
  param("id").isMongoId(),
  validator,
  roomHandlers.infoHandler
);

// JSON으로 받은 정보로 방을 생성한다.
router.post(
  "/create",
  [
    body("name").matches(patterns.room.name),
    body("from").matches(patterns.room.from),
    body("to").matches(patterns.room.to),
    body("time").isISO8601(),
    body("maxPartLength").isInt({ min: 1, max: 4 }),
  ],
  validator,
  setTimestamp,
  roomHandlers.createHandler
);

// 새로운 사용자를 방에 참여시킨다.
// FIXME: req.body.users 검증할 때 SSO ID 규칙 반영하기
router.post(
  "/invite",
  [
    body("roomId").isMongoId(),
    body("users").isArray(),
    body("users.*").isLength({ min: 1, max: 30 }).isAlphanumeric(),
  ],
  validator,
  roomHandlers.inviteHandler
);

// 기존 방에서 나간다. (채팅 이벤트 연동 안됨: 방 주인이 바뀌는 경우.)
// request: {roomId: 나갈 방}
// result: Room
// 모든 사람이 나갈 경우 방 삭제.
router.post(
  "/abort",
  body("roomId").isMongoId(),
  validator,
  setTimestamp,
  roomHandlers.abortHandler
);

// 조건(이름, 출발지, 도착지, 날짜)에 맞는 방들을 모두 반환한다.
router.get(
  "/search",
  [
    query("name").optional().matches(patterns.room.name),
    query("from").optional().matches(patterns.room.from),
    query("to").optional().matches(patterns.room.to),
    query("time").optional().isISO8601(),
  ],
  validator,
  setTimestamp,
  roomHandlers.searchHandler
);

// 로그인된 사용자의 모든 방들을 반환한다.
router.get("/searchByUser/", roomHandlers.searchByUserHandler);

// 해당 룸의 요청을 보낸 유저의 정산을 완료로 처리한다.
router.post(
  "/:id/settlement",
  param("id").isMongoId(),
  validator,
  roomHandlers.idSettlementHandler
);

// THE ROUTES BELOW ARE ONLY FOR TEST
router.get("/getAllRoom", roomHandlers.getAllRoomHandler);

router.get("/removeAllRoom", roomHandlers.removeAllRoomHandler);

// json으로 수정할 값들을 받아 방의 정보를 수정합니다.
// request JSON
// name, from, to, time, part
// FIXME: req.body.users 검증할 때 SSO ID 규칙 반영하기
router.post(
  "/:id/edit",
  [
    body("name").optional().matches(patterns.room.name),
    body("from").optional().matches(patterns.room.from),
    body("to").optional().matches(patterns.room.to),
    body("time").optional().isISO8601(),
    body("part").isArray(),
    body("part.*").optional().isLength({ min: 1, max: 30 }).isAlphanumeric(),
  ],
  validator,
  roomHandlers.idEditHandler
);

// FIXME: 방장만 삭제 가능.
router.get(
  "/:id/delete",
  param("id").isMongoId(),
  validator,
  roomHandlers.idDeleteHandler
);

module.exports = router;
