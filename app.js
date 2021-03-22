// 외부 모듈 require
const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');

const proxy = require('http-proxy-middleware').createProxyMiddleware;
const errorHandler = require('errorhandler');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const fs = require('fs');
const socketio = require('socket.io');
const cors = require('cors');

const bkfd2Password = require("pbkdf2-password");
const hasher = bkfd2Password();

// 내부 모듈
const security = require('./security');
var mongo = require('./mongo');

// 익스프레스 객체 생성
var app = express();
app.set('port', process.env.PORT || 443);
app.use(bodyParser.urlencoded({ extended : false }));
app.use(bodyParser.json());
app.use(proxy('/', { target: 'http://localhost:3000/' }));

// 쿠키 및 세션
app.use(cookieParser());
app.use(expressSession({ secret: security.session, resave: true, saveUninitialized: true }));

// cors 미들웨어
app.use(cors());

// Express 서버 시작
var server_http = http.createServer(app).listen(443, function(){
    console.log('Express 서버가 443번 포트에서 시작됨.');
});
