// 외부 모듈 require
const express = require("express");
const http = require("http");
const https = require("https");

const proxy = require("http-proxy-middleware").createProxyMiddleware;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const MongoStore = require("connect-mongo");
const fs = require("fs");
const cors = require("cors");
const startSocketServer = require("./src/modules/socket");

//const bkfd2Password = require("pbkdf2-password");
//const hasher = bkfd2Password();

// 내부 모듈
const security = require("./security");

// 익스프레스 서버 생성
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
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

// 라우터 및 리액트
app.use("/auth", require("./src/route/auth"));
app.use("/json/logininfo", require("./src/route/logininfo"));
app.use("/users", require("./src/route/users"));
app.use("/rooms", require("./src/route/rooms"));
app.use("/chats", require("./src/route/chats"));
app.use("/static", require("./src/route/static"));

const serverHttp = http.createServer(app).listen(security.nodePort, () => {
  console.log(`Express 서버가 ${security.nodePort}번 포트에서 시작됨.`);
});

startSocketServer(serverHttp, session);
