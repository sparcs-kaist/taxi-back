import express from "express";
import { validateBody } from "@/middlewares/zod";
import { favoriteRoutesZod } from "./docs/schemas/favoriteRoutesSchema";
import {
  createHandler,
  getHandler,
  deleteHandler,
} from "@/services/favoriteRoutes";
import authMiddleware from "@/middlewares/auth";

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
