import express from "express";
import {
  transactionViewHandler,
  transactionCreateHandler,
} from "../services/transaction";
import { mileageZod } from "./docs/schemas/mileageSchema";
import { validateQuery, validateBody } from "@/middlewares";

const router = express.Router();

// 라우터 접근 시 로그인 필요
router.use(require("@/middlewares/auth").default);

router.post(
  "/",
  validateBody(mileageZod.transactionCreateHandler),
  transactionCreateHandler
); // record

router.get(
  "/view",
  validateQuery(mileageZod.transactionViewHandler),
  transactionViewHandler
); // view

export default router;
