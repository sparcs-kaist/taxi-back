import express, { Router } from "express";

import { validateQuery } from "../middlewares/zod";
import { fareZod } from "./docs/schemas/fareSchema";
import { getTaxiFare } from "../services/fare";

const router: Router = express.Router();

router.get("/getTaxiFare", validateQuery(fareZod.getTaxiFare), getTaxiFare);

export default router;
