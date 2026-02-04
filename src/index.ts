// 모듈 import
import express from "express";
import cookieParser from "cookie-parser";
import http from "http";

import {
  nodeEnv,
  mongo as mongoUrl,
  port as httpPort,
  eventConfig,
} from "@/loadenv";
import {
  banMiddleware,
  corsMiddleware,
  errorHandler,
  informationMiddleware,
  limitRateMiddleware,
  originValidatorMiddleware,
  responseTimeMiddleware,
  sessionMiddleware,
} from "@/middlewares";
import {
  adminRouter,
  authRouter,
  chatRouter,
  docsRouter,
  emailRouter,
  fareRouter,
  locationRouter,
  logininfoRouter,
  noticeRouter,
  notificationRouter,
  reportRouter,
  roomRouter,
  userRouter,
} from "@/routes";

import { initializeApp as initializeFirebase } from "@/modules/fcm";
import { initializeDatabase as initializeFareDatabase } from "@/modules/fare";
import logger from "@/modules/logger";
import { startSocketServer } from "@/modules/socket";
import { connectDatabase } from "@/modules/stores/mongo";
import registerSchedules from "@/schedules";
import { lotteryRouter } from "@/lottery";

// Firebase Admin 초기설정
initializeFirebase();

// 데이터베이스 연결
connectDatabase(mongoUrl);

// 익스프레스 서버 생성
const app = express();

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

// [Middleware] API 요청에 대하여 Ban 여부 검증
app.use(banMiddleware);

// [Router] 이메일 수신 확인은 origin 검사 거치지 않기
app.use("/emails", emailRouter);

// [Middleware] 모든 API 요청에 대하여 origin 검증
app.use(originValidatorMiddleware);

// [Router] 이벤트 전용 라우터입니다.
if (eventConfig) {
  app.use(`/events/${eventConfig.mode}`, lotteryRouter);
}

// [Router] APIs
app.use("/auth", authRouter);
app.use("/chats", chatRouter);
app.use("/fare", fareRouter);
app.use("/locations", locationRouter);
app.use("/logininfo", logininfoRouter);
app.use("/notice", noticeRouter);
app.use("/notifications", notificationRouter);
app.use("/reports", reportRouter);
app.use("/rooms", roomRouter);
app.use("/users", userRouter);

// [Middleware] 전역 에러 핸들러. 에러 핸들러는 router들보다 아래에 등록되어야 합니다.
app.use(errorHandler);

// express 서버 시작
const serverHttp = http
  .createServer(app)
  .listen(httpPort, () =>
    logger.info(`Express server started from port ${httpPort}`)
  );

// socket.io 서버 시작
app.set("io", startSocketServer(serverHttp));

// [Schedule] 스케줄러 시작
registerSchedules(app);

// [Module] 택시 예상 비용 db 초기화
initializeFareDatabase();
