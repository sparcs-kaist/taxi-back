import express from "express";
import { emailHandler } from "@/services/email";
import { validateQuery } from "@/middlewares";
import { emailZod } from "@/routes/docs/schemas/emailSchema";

const router = express.Router();

router.get(
  "/open-tracking",
  validateQuery(emailZod.emailHandler),
  emailHandler
);

export default router;
