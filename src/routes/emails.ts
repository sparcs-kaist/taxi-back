import express from "express";
import { emailTrackingHandler } from "@/services/emails";
import { validateQuery } from "@/middlewares";
import { emailsZod } from "@/routes/docs/schemas/emailsSchema";

const router = express.Router();

router.get(
  "/openTracking",
  validateQuery(emailsZod.emailTrackingHandler),
  emailTrackingHandler
);

export default router;
