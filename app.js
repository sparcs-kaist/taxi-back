// 모듈 require
const express = require("express");
const http = require("http");
const {
  nodeEnv,
  port: httpPort,
  eventConfig,
  mongo: mongoUrl,
} = require("./loadenv");
const logger = require("./src/modules/logger");
const { connectDatabase } = require("./src/modules/stores/mongo");
const { startSocketServer } = require("./src/modules/socket");

// Firebase Admin 초기설정
require("./src/modules/fcm").initializeApp();

// 익스프레스 서버 생성
const app = express();

// 데이터베이스 연결
connectDatabase(mongoUrl);

// [Middleware] request body 파싱
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// reverse proxy가 설정한 헤더를 신뢰합니다.
if (nodeEnv === "production") app.set("trust proxy", 2);

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

// [Router] 이벤트 전용 라우터입니다.
eventConfig &&
  app.use(
    `/events/${eventConfig.mode}`,
    require("./src/lottery").lotteryRouter
  );

// [Middleware] 모든 API 요청에 대하여 origin 검증
app.use(require("./src/middlewares/originValidator"));

// [Router] APIs
app.use("/auth", require("./src/routes/auth"));
app.use("/logininfo", require("./src/routes/logininfo"));
app.use("/users", require("./src/routes/users"));
app.use("/rooms", require("./src/routes/rooms"));
app.use("/chats", require("./src/routes/chats"));
app.use("/locations", require("./src/routes/locations"));
app.use("/reports", require("./src/routes/reports"));
app.use("/notifications", require("./src/routes/notifications"));

// [Middleware] 전역 에러 핸들러. 에러 핸들러는 router들보다 아래에 등록되어야 합니다.
app.use(require("./src/middlewares/errorHandler"));

// express 서버 시작
const serverHttp = http
  .createServer(app)
  .listen(httpPort, () =>
    logger.info(`Express server started from port ${httpPort}`)
  );

// socket.io 서버 시작
app.set("io", startSocketServer(serverHttp));

// [Schedule] 스케줄러 시작
require("./src/schedules")(app);
