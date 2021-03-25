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
const mongo = require('./mongo');

// 익스프레스 서버
const app = express();
app.use(bodyParser.urlencoded({ extended : false }));
app.use(bodyParser.json());
app.use(cookieParser()); // 쿠키
app.use(expressSession({ secret: security.session, resave: true, saveUninitialized: true })); // 세션
app.use(cors());

app.use(proxy('/', { target: 'http://localhost:3000/' }));

const serverHttp = http.createServer(app).listen(443, () => {
    console.log('Express 서버가 443번 포트에서 시작됨.');
});