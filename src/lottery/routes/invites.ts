import express from "express";
import type { Router } from "express";
import { validateParams } from "../../middlewares/zod";
import { invitesZod } from "./docs/schemas/invitesSchema";
import invitesHandlers from "../services/invites";
import authMiddleware from "../../middlewares/auth";
import timestampValidator from "../middlewares/timestampValidator";
import banMiddleware from "../middlewares/checkBanned";

const router: Router = express.Router();

router.get(
  "/search/:inviter",
  validateParams(invitesZod.searchInviterHandler),
  invitesHandlers.searchInviterHandler
);

router.use(authMiddleware);
router.use(banMiddleware);
router.use(timestampValidator);

router.post("/create", invitesHandlers.createInviteUrlHandler);

export default router;
