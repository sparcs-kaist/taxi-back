// 외부 모듈 require
const express = require("express");
const http = require("http");

// 내부 모듈
const security = require("./security");
const logger = require("./src/modules/logger");
const logAPIAccess = require("./src/modules/logAPIAccess");
const startSocketServer = require("./src/modules/socket");

// 익스프레스 서버 생성
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// CORS 설정
app.use(require("cors")({ origin: true, credentials: true }));

// 세션 및 쿠키
const session = require("./src/middleware/session");
app.use(session);
app.use(require("cookie-parser")());

// Swagger (API 문서)
app.use(require("./src/middleware/swagger"));

// API 접근 기록 및 응답 시간을 http response의 헤더에 기록합니다.
app.use(require("response-time")(logAPIAccess));

// admin 페이지는 rate limiting을 적용하지 않습니다.
app.use("/admin/logs", require("./src/route/admin.logs"));
app.use("/admin", require("./src/route/admin"));

// Apply the rate limiting middleware to all requests
app.use(require("./src/middleware/limitRate"));

// 라우터 및 리액트
// /rooms/v2에 요청을 보내는 기존 클라이언트 코드 호환성 유지
app.use("/auth", require("./src/route/auth"));
app.use(["/logininfo", "/json/logininfo"], require("./src/route/logininfo"));
app.use("/users", require("./src/route/users"));
app.use(["/rooms/v2", "/rooms"], require("./src/route/rooms"));
app.use("/chats", require("./src/route/chats"));
app.use("/locations", require("./src/route/locations"));
app.use("/reports", require("./src/route/reports"));

// express 서버 시작
const serverHttp = http.createServer(app).listen(security.port, () => {
  logger.info(`Express 서버가 ${security.port}번 포트에서 시작됨.`);
});

// socket.io 서버 시작 및 app 인스턴스에 저장
app.set("io", startSocketServer(serverHttp, session));
