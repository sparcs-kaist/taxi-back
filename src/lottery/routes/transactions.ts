import express from "express";

import { authMiddleware } from "@/middlewares";
import { getUserTransactionsHandler } from "../services/transactions";
const router = express.Router();

// 아래의 Endpoint 접근 시 로그인 필요
router.use(authMiddleware);

router.get("/", getUserTransactionsHandler);

export default router;
