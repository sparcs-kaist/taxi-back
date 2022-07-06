const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { query, param, body } = require("express-validator");
const roomHandlers = require("../service/rooms");
const { urlencoded } = require("body-parser");

// 라우터 접근 시 로그인 필요
router.use(authMiddleware);

// 입력 데이터 검증을 위한 정규 표현식들
const patterns = {
  name: RegExp("^[A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ,.?! _-]{1,20}$"),
  from: RegExp("^[A-Za-z0-9가-힣 -]{1,20}$"),
  to: RegExp("^[A-Za-z0-9가-힣 -]{1,20}$"),
};

// 특정 id 방 세부사항 보기
router.get("/:id/info", param("id").isMongoId(), roomHandlers.infoHandler);

// JSON으로 받은 정보로 방을 생성한다.
router.post(
  "/create",
  [
    body("name").matches(patterns.name),
    body("from").matches(patterns.from),
    body("to").matches(patterns.to),
    body("time").isISO8601(),
  ],
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
  roomHandlers.inviteHandler
);

// 기존 방에서 나간다. (채팅 이벤트 연동 안됨: 방 주인이 바뀌는 경우.)
// request: {roomId: 나갈 방}
// result: Room
// 모든 사람이 나갈 경우 방 삭제.
router.post("/abort", body("roomId").isMongoId(), roomHandlers.abortHandler);

// 조건(이름, 출발지, 도착지, 날짜)에 맞는 방들을 모두 반환한다.
// 어떻게 짜야 잘 짰다고 소문이 여기저기 동네방네 다 날까?
router.get(
  "/search",
  [
    query("name").optional().matches(patterns.name),
    query("from").optional().matches(patterns.from),
    query("to").optional().matches(patterns.to),
    query("time").optional().isISO8601(),
  ],
  roomHandlers.searchHandler
);

// 로그인된 사용자의 모든 방들을 반환한다.
router.get("/searchByUser/", roomHandlers.searchByUserHandler);

router.post(
  "/:id/settlement",
  param("id").isMongoId(),
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
    body("name").optional().matches(patterns.name),
    body("from").optional().matches(patterns.from),
    body("to").optional().matches(patterns.to),
    body("time").optional().isISO8601(),
    body("part").isArray(),
    body("part.*").optional().isLength({ min: 1, max: 30 }).isAlphanumeric(),
  ],
  roomHandlers.idEditHandler
);

// FIXME: 방장만 삭제 가능.
router.get(
  "/:id/delete",
  param("id").isMongoId(),
  roomHandlers.idDeleteHandler
);

module.exports = router;
