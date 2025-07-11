import { z } from "zod";
import { zodToSchemaObject } from "@/routes/docs/utils";

// 날짜 및 답안 형식 검증용 Zod 객체
export const quizzesZod = {
  getQuizByDateParams: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD."),
  }),
  submitAnswerBody: z.object({
    answer: z.enum(["A", "B"]),
  }),
};

export const quizzesSchema = zodToSchemaObject(quizzesZod);
