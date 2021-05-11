// 외부 모듈 require
const express = require('express');
const http = require('http');
const https = require('https');

const proxy = require('http-proxy-middleware').createProxyMiddleware;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const fs = require('fs');
const socketio = require('socket.io');
const cors = require('cors');

//const bkfd2Password = require("pbkdf2-password");
//const hasher = bkfd2Password();

// 내부 모듈
const security = require('./security');
const mongo = require('./src/db/mongo');
const login = require('./src/auth/login');

// 익스프레스 서버 생성
const app = express();
app.use(bodyParser.urlencoded({ extended : false }));
app.use(bodyParser.json());
app.use(cors({ origin: true, credentials: true }));

// 세션 및 쿠키
const session = expressSession({ secret: security.session, resave: true, saveUninitialized: true });
app.use(session);
app.use(cookieParser());

// 라우터 및 리액트
app.use('/auth', require('./src/route/auth')(mongo, login));
app.use('/json/logininfo', require('./src/route/logininfo')(mongo, login));
app.use('/users', require('./src/route/users')(mongo));
app.use('/rooms', require('./src/route/rooms')(mongo));

const serverHttp = http.createServer(app).listen(security.nodePort, () => {
    console.log(`Express 서버가 ${security.nodePort}번 포트에서 시작됨.`);
});