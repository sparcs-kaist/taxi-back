import { Router } from "express";
import {
  getTodayQuizHandler,
  getQuizByDateHandler,
  submitAnswerHandler,
  cancelAnswerHandler,
  getTodayAnswerHandler,
  getAllAnswersHandler,
} from "../services/quizzes";
import quizzesSchema from "./docs/schemas/quizzesSchema";
import { validateParams, validateBody } from "../../middlewares/zod";
import authMiddleware from "../../middlewares/auth";

const router = Router();

// Get today's quiz
router.get("/today", getTodayQuizHandler);

// Get today answer
router.get("/todayAnswer", authMiddleware, getTodayAnswerHandler);

// Get All answers
router.get("/answers", authMiddleware, getAllAnswersHandler);

// Get quiz by date
router.get(
  "/:date",
  validateParams(quizzesSchema.getQuizByDateParams),
  getQuizByDateHandler
);

// Submit quiz answer
router.post(
  "/submit",
  validateBody(quizzesSchema.submitAnswerBody),
  authMiddleware,
  submitAnswerHandler
);

// Cancel quiz answer
router.post("/cancel", authMiddleware, cancelAnswerHandler);

export default router;
