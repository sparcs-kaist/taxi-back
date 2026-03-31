import express from "express";
import { summaryHandler } from "../services/summary";

const router = express.Router();

router.get("/", summaryHandler);

export default router;
