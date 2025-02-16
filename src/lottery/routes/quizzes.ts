import { Router } from "express";
import {
  getTodayQuiz,
  getQuizByDate,
  submitAnswer,
  cancelAnswer,
  getTodayAnswer,
  getAllAnswers,
} from "../services/quizzes";
import quizzesSchema from "./docs/schemas/quizzesSchema";
import { validateParams, validateBody } from "../../middlewares/zod";
import authMiddleware from "../../middlewares/auth";

const router = Router();

// Get today's quiz
router.get("/today", getTodayQuiz);

// Get today answer
router.get("/todayAnswer", authMiddleware, getTodayAnswer);

// Get All answers
router.get("/answers", authMiddleware, getAllAnswers);

// Get quiz by date
router.get(
  "/:date",
  validateParams(quizzesSchema.getQuizByDateParams),
  getQuizByDate
);

// Submit quiz answer
router.post(
  "/submit",
  validateBody(quizzesSchema.submitAnswerBody),
  authMiddleware,
  submitAnswer
);

// Cancel quiz answer
router.post("/cancel", authMiddleware, cancelAnswer);

export default router;
