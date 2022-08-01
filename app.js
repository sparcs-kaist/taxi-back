// 외부 모듈 require
const express = require("express");
const http = require("http");
const https = require("https");

const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");

// 내부 모듈
const security = require("./security");
const logger = require("./src/modules/logger");
const logAPIAccess = require("./src/modules/logAPIAccess");
const startSocketServer = require("./src/modules/socket");

// 익스프레스 서버 생성
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// 세션 및 쿠키. 세션은 mongodb 데이터베이스에 저장합니다.
const session = expressSession({
  secret: security.session,
  resave: true,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: security.mongo,
  }),
});
app.use(session);
app.use(cookieParser());

// API 접근 기록 및 응답 시간을 http response의 헤더에 기록합니다.
app.use(require("response-time")(logAPIAccess));

// 라우터 및 리액트
app.use("/auth", require("./src/route/auth"));
app.use("/json/logininfo", require("./src/route/logininfo"));
app.use("/users", require("./src/route/users"));
app.use("/rooms", require("./src/route/rooms"));
app.use("/chats", require("./src/route/chats"));
app.use("/static", require("./src/route/static"));
app.use("/admin", require("./src/route/admin"));

// express 서버 시작
const serverHttp = http.createServer(app).listen(security.nodePort, () => {
  logger.info(`Express 서버가 ${security.nodePort}번 포트에서 시작됨.`);
});

// socket.io 서버 시작 및 app 인스턴스에 저장
app.set("io", startSocketServer(serverHttp, session));
