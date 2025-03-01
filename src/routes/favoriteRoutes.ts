import express from "express";
import { validateBody, validateParams, validateQuery } from "@/middlewares/zod"; // Zod 검증 미들웨어
import { favoriteRoutesZod } from "./docs/schemas/favoriteRoutesSchema"; // Zod 스키마
import {
  createHandler,
  getHandler,
  deleteHandler,
} from "@/services/favoriteRoutes";
import authMiddleware from "@/middlewares/auth"; // 인증 미들웨어

const router = express.Router();

// 라우터 접근 시 로그인 필요
router.use(authMiddleware);

// 즐겨찾기 생성
router.post(
  "/create",
  validateBody(favoriteRoutesZod.createHandler),
  createHandler
);

// 즐겨찾기 조회
router.get("/", getHandler);

// 즐겨찾기 삭제
router.delete("/:id", deleteHandler);

export default router;
