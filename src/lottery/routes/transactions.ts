import express from "express";

import getUserTransactionsHandler from "../services/transactions";
import authMiddleware from "../../middlewares/auth";
const router = express.Router();

// 아래의 Endpoint 접근 시 로그인 필요
router.use(authMiddleware);

router.get("/", getUserTransactionsHandler);

export default router;
