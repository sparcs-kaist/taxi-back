import express from "express";
import { transactionViewHandler } from "../services/transaction";
import { mileageZod } from "./docs/schemas/mileageSchema";
import { validateQuery } from "@/middlewares";
import authMiddleware from "@/middlewares/auth";

const router = express.Router();

// 라우터 접근 시 로그인 필요
router.use(authMiddleware);

router.get(
  "/view",
  validateQuery(mileageZod.transactionViewHandler),
  transactionViewHandler
);

export default router;
