import express from "express";
import { validateBody } from "@/middlewares/zod";
import { reportsZod } from "./docs/schemas/reportsSchema";
import * as reportHandlers from "@/services/reports";
import { authMiddleware } from "@/middlewares";

const router = express.Router();

// 라우터 접근 시 로그인 필요
router.use(authMiddleware);

router.post(
  "/create",
  validateBody(reportsZod.createHandler),
  reportHandlers.createHandler
);

router.get("/searchByUser", reportHandlers.searchByUserHandler);

export default router;
