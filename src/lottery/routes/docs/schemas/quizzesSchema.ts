import { z } from "zod";

// 날짜 형식 검증용 Zod 객체
export const quizzesZod = {
  getQuizByDateParams: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD."),
  }),
};

export const quizzesSchema = {
  getQuizByDateParams: quizzesZod.getQuizByDateParams,
};

export default quizzesSchema;
