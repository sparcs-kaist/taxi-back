import express from "express";
import { emailTrackingHandler } from "@/services/email";
import { validateQuery } from "@/middlewares";
import { emailZod } from "@/routes/docs/schemas/emailSchema";

const router = express.Router();

router.get(
  "/openTracking",
  validateQuery(emailZod.emailTrackingHandler),
  emailTrackingHandler
);

export default router;
