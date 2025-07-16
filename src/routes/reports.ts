import express from "express";
import { authMiddleware, validateBody } from "@/middlewares";
import { reportsZod } from "./docs/schemas/reportsSchema";
import * as reportHandlers from "@/services/reports";

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
