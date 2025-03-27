import logger from "@/modules/logger";
import { completeAnswerCorrectlyQuest } from "../modules/contracts";
import { getQuizByDate } from "../modules/quizzes";
import { Quiz } from "../types";

type CorrectAnswer = "A" | "B" | "draw";

const determineQuizResult = async () => {
  try {
    const quiz = await getQuizByDate(new Date());

    if (!quiz) {
      logger.info("No quiz found for today.");
      return;
    }

    let correctAnswer: CorrectAnswer = "A";

    if (quiz.answer === "A" || quiz.answer === "B") {
      correctAnswer = quiz.answer;
    } else {
      if (quiz.answer === "C") {
        // C 타입: 더 많은 사람이 선택한 답이 정답
        correctAnswer = quiz.countA >= quiz.countB ? "A" : "B";
      } else {
        // D 타입: 더 적은 사람이 선택한 답이 정답
        correctAnswer = quiz.countA < quiz.countB ? "A" : "B";
      }
      // A와 B의 선택 수가 동일할 때 draw 처리
      if (quiz.countA === quiz.countB) {
        quiz.answers.forEach((answer: { answer: string; status: string }) => {
          answer.status = "draw";
        });
      }
    }

    // 사용자의 정/오답 처리 & 코인 지급
    await Promise.all(
      quiz.answers.map(async (answer: any) => {
        if (answer.answer === correctAnswer || answer.status === "draw") {
          if (answer.status !== "draw") {
            answer.status = "correct";
          }
          // 정답을 맞힌 사용자에게 퀘스트 완료 적용
          await completeAnswerCorrectlyQuest(
            answer.userId.toString(),
            Date.now()
          );
        } else {
          answer.status = "wrong";
        }
      })
    );

    // 저장
    quiz.answer = correctAnswer; // 최종 정답 기록
    await quiz.save();

    logger.info(`Quiz result determined: ${correctAnswer}`);
  } catch (error) {
    logger.error("Error determining quiz result:");
    logger.error(error);
  }
};

export default determineQuizResult;
