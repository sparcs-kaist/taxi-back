import { Router } from "express";
import {
  getTodayQuiz,
  getQuizByDate,
  submitAnswer,
  cancelAnswer,
  getTodayAnswer,
  getAllAnswers,
} from "../services/quiz";

const router = Router();

// Get today's quiz
router.get("/today", getTodayQuiz);

// Get today answer
router.get("/todayAnswer", getTodayAnswer);

// Get All answers
router.get("/answers", getAllAnswers);

// Get quiz by date
router.get("/:date", getQuizByDate);

// Submit quiz answer
router.post("/submit", submitAnswer);

// Cancel quiz answer
router.post("/cancel", cancelAnswer);

export default router;
