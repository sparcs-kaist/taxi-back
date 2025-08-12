import express from "express";

import { validateQuery } from "@/middlewares/zod";
import { fareZod } from "./docs/schemas/fareSchema";
import { getTaxiFareHandler } from "@/services/fare";

const router = express.Router();

router.get(
  "/getTaxiFare",
  validateQuery(fareZod.getTaxiFareHandler),
  getTaxiFareHandler
);

export default router;
