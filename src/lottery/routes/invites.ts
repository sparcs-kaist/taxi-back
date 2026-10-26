import express from "express";
import { validateParams } from "../../middlewares/zod";
import { invitesZod } from "./docs/schemas/invitesSchema";
import {
  searchInviterHandler,
  createInviteUrlHandler,
} from "../services/invites";
import { timestampValidator, banMiddleware } from "../middlewares";
import { authMiddleware } from "@/middlewares";

const router = express.Router();

router.get(
  "/search/:inviter",
  validateParams(invitesZod.searchInviterHandler),
  searchInviterHandler
);

router.use(authMiddleware);
router.use(banMiddleware);
router.use(timestampValidator);

router.post("/create", createInviteUrlHandler);

export default router;
