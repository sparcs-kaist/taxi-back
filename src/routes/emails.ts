import express from "express";
import { emailHandler } from "@/services/email";

const router = express.Router();

router.get("/open-tracking", emailHandler);

export default router;
