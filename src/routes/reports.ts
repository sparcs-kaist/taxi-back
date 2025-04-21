import express from "express";
import { validateBody } from "@/middlewares/zod";
import { reportsZod } from "@/routes/docs/schemas/reportsSchema";
const router = express.Router();
import * as reportHandlers from "@/services/reports";
import { authMiddleware } from "@/middlewares";

// 라우터 접근 시 로그인 필요
router.use(authMiddleware);

router.post(
  "/create",
  validateBody(reportsZod.createHandler),
  reportHandlers.createHandler
);

router.get("/searchByUser", reportHandlers.searchByUserHandler);

export default router;
