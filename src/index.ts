// 모듈 import
import express from "express";
import cookieParser from "cookie-parser";
import http from "http";

import { nodeEnv, port as httpPort } from "@/loadenv";
import {
  corsMiddleware,
  sessionMiddleware,
  informationMiddleware,
  responseTimeMiddleware,
  limitRateMiddleware,
  originValidatorMiddleware,
  errorHandler,
} from "@/middlewares";
import {
  authRouter,
  logininfoRouter,
  userRouter,
  roomRouter,
  chatRouter,
  locationRouter,
  reportRouter,
  notificationRouter,
  adminRouter,
  docsRouter,
} from "@/routes";
import { initializeApp } from "@/modules/fcm";
import logger from "@/modules/logger";
import { connectDatabase } from "@/modules/stores/mongo";
import { startSocketServer } from "@/modules/socket";
import registerSchedules from "@/schedules";

// Firebase Admin 초기설정
initializeApp();

// 익스프레스 서버 생성
const app = express();

// 데이터베이스 연결
connectDatabase();

// [Middleware] request body 파싱
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// reverse proxy가 설정한 헤더를 신뢰합니다.
if (nodeEnv === "production") app.set("trust proxy", 2);

// [Middleware] CORS 설정
app.use(corsMiddleware);

// [Middleware] 세션 및 쿠키
app.use(sessionMiddleware);
app.use(cookieParser());

// [Middleware] Timestamp 및 clientIP 확인
app.use(informationMiddleware);

// [Middleware] API 접근 기록 및 응답 시간을 http response의 헤더에 기록합니다.
app.use(responseTimeMiddleware);

// [Router] admin 페이지는 rate limiting을 적용하지 않습니다.
app.use("/admin", adminRouter);

// [Middleware] 모든 요청에 대하여 rate limiting 적용
app.use(limitRateMiddleware);

// [Router] Swagger (API 문서)
app.use("/docs", docsRouter);

// 2023 추석 이벤트 전용 라우터입니다.
// eventConfig &&
//   app.use(`/events/${eventConfig.mode}`, require("@/lottery").lotteryRouter);

// [Middleware] 모든 API 요청에 대하여 origin 검증
app.use(originValidatorMiddleware);

// [Router] APIs
app.use("/auth", authRouter);
app.use("/logininfo", logininfoRouter);
app.use("/users", userRouter);
app.use("/rooms", roomRouter);
app.use("/chats", chatRouter);
app.use("/locations", locationRouter);
app.use("/reports", reportRouter);
app.use("/notifications", notificationRouter);

// [Middleware] 전역 에러 핸들러. 에러 핸들러는 router들보다 아래에 등록되어야 합니다.
app.use(errorHandler);

// express 서버 시작
const serverHttp = http
  .createServer(app)
  .listen(httpPort, () =>
    logger.info(`Express 서버가 ${httpPort}번 포트에서 시작됨.`)
  );

// socket.io 서버 시작
app.set("io", startSocketServer(serverHttp));

// [Schedule] 스케줄러 시작
registerSchedules(app);
