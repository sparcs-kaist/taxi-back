import express from "express";
import { getNoticesHandler } from "../services/notice";

const router = express.Router();

router.get("/list", getNoticesHandler);

export default router;
