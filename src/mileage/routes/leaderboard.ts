import express from "express";
import { leaderboardHandler } from "../services/leaderboard";
import { mileageZod } from "./docs/schemas/mileageSchema";
import { validateQuery } from "@/middlewares";

const router = express.Router();

router.get(
  "/",
  validateQuery(mileageZod.leaderboardHandler),
  leaderboardHandler
);

export default router;
