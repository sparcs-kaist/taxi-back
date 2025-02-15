import { quizModel } from "../modules/stores/mongo";
import logger from "../../modules/logger";

const determineQuizResult = async () => {
  try {
    const yesterdayMidnight = new Date();
    yesterdayMidnight.setHours(0, 0, 0, 0);
    yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    // 어제의 퀴즈 조회
    const quiz = await quizModel.findOne({
      quizDate: {
        $gte: yesterdayMidnight,
        $lt: todayMidnight,
      },
    });

    if (!quiz) {
      logger.info("No quiz found for yesterday.");
      return;
    }

    let correctAnswer;

    if (quiz.answer === "C") {
      // C 타입: 더 많은 사람이 선택한 답이 정답
      correctAnswer = quiz.countA >= quiz.countB ? "A" : "B";
    } else if (quiz.answer === "D") {
      // D 타입: 더 적은 사람이 선택한 답이 정답
      correctAnswer = quiz.countA < quiz.countB ? "A" : "B";
    } else {
      // A 또는 B가 이미 정해져 있는 경우
      correctAnswer = quiz.answer;
    }

    // A와 B의 선택 수가 동일할 때 draw 처리
    if (quiz.countA === quiz.countB) {
      quiz.answers.forEach((answer: any) => {
        answer.status = "draw";
      });
    } else {
      // 사용자의 정/오답 처리
      quiz.answers.forEach((answer: any) => {
        answer.status = answer.answer === correctAnswer ? "correct" : "wrong";
      });
    }

    // 저장
    quiz.answer = correctAnswer; // 최종 정답 기록
    await quiz.save();

    logger.info(`Quiz result determined: ${correctAnswer}`);
  } catch (error) {
    logger.error("Error determining quiz result:", error);
  }
};

export default determineQuizResult;
