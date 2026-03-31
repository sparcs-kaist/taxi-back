import express from "express";
import { transactionViewHandler } from "../services/transaction";
import { mileageZod } from "./docs/schemas/mileageSchema";
import { validateQuery } from "@/middlewares";

const router = express.Router();

router.get(
  "/view",
  validateQuery(mileageZod.transactionViewHandler),
  transactionViewHandler
);

export default router;
