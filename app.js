// 모듈 require
const express = require("express");
const http = require("http");
const { port: httpPort } = require("./loadenv");
const logger = require("./src/modules/logger");
const { startSocketServer } = require("./src/modules/socket");

// Firebase Admin 초기설정
require("./src/modules/fcm").initializeApp();

// 익스프레스 서버 생성
const app = express();

// [Middleware] request body 파싱
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// [Middleware] CORS 설정
app.use(require("./src/middlewares/cors"));

// [Middleware] 세션 및 쿠키
const session = require("./src/middlewares/session");
app.use(session);
app.use(require("cookie-parser")());

// [Middleware] Timestamp 및 clientIP 확인
app.use(require("./src/middlewares/information"));

// [Middleware] API 접근 기록 및 응답 시간을 http response의 헤더에 기록합니다.
app.use(require("./src/middlewares/responseTime"));

// [Router] admin 페이지는 rate limiting을 적용하지 않습니다.
app.use("/admin", require("./src/routes/admin"));

// [Middleware] 모든 요청에 대하여 rate limiting 적용
app.use(require("./src/middlewares/limitRate"));

// [Router] Swagger (API 문서)
app.use("/docs", require("./src/routes/docs"));

// [Router] APIs
app.use("/auth", require("./src/routes/auth"));
app.use("/logininfo", require("./src/routes/logininfo"));
app.use("/users", require("./src/routes/users"));
app.use("/rooms", require("./src/routes/rooms"));
app.use("/chats", require("./src/routes/chats"));
app.use("/locations", require("./src/routes/locations"));
app.use("/reports", require("./src/routes/reports"));
app.use("/notifications", require("./src/routes/notifications"));

// express 서버 시작
const serverHttp = http
  .createServer(app)
  .listen(httpPort, () =>
    logger.info(`Express 서버가 ${httpPort}번 포트에서 시작됨.`)
  );

// socket.io 서버 시작 및 app 인스턴스에 저장
app.set("io", startSocketServer(serverHttp));
