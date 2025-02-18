import { RequestHandler } from "express";
import { quizModel } from "../modules/stores/mongo";
import logger from "@/modules/logger";

export const getTodayQuizHandler: RequestHandler = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(startOfToday.getDate() + 1);

    // 오늘의 퀴즈 조회
    const quiz = await quizModel
      .findOne({
        quizDate: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      })
      .lean();

    if (!quiz) {
      return res.status(404).json({ message: "No quiz found for today" });
    }

    const response = {
      quizDate: quiz.quizDate,
      quizTitle: quiz.title,
      quizContent: quiz.content,
      quizImage: quiz.image,
      quizCount: quiz.answers.length,
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Quizzes/today : internal server error" });
  }
};

export const getQuizByDateHandler: RequestHandler = async (req, res) => {
  try {
    const { date }: { date: string } = req.params;

    const [year, month, day] = date.split("-").map(Number);
    const requestedDate = new Date(year, month - 1, day);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 미래 날짜 조회 제한
    if (requestedDate >= startOfToday) {
      return res
        .status(403)
        .json({ message: "You cannot access future quizzes." });
    }

    const startOfDate = new Date(year, month - 1, day, 0, 0, 0);
    const endOfDate = new Date(year, month - 1, day, 23, 59, 59);

    // 해당 날짜의 퀴즈 조회
    const quiz = await quizModel
      .findOne({
        quizDate: {
          $gte: startOfDate,
          $lt: endOfDate,
        },
      })
      .lean();

    if (!quiz) {
      return res
        .status(404)
        .json({ message: "No quiz found for the specified date." });
    }

    // 정답 비율 계산
    const totalCount = quiz.countA + quiz.countB;
    const pickRatio = {
      A: totalCount > 0 ? Math.round((quiz.countA / totalCount) * 100) : 0,
      B: totalCount > 0 ? Math.round((quiz.countB / totalCount) * 100) : 0,
    };

    const response = {
      quizDate: quiz.quizDate,
      quizTitle: quiz.title,
      quizImage: quiz.image,
      quizContent: quiz.content,
      quizCount: totalCount,
      answer: quiz.answer,
      pickRatio: pickRatio,
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Quizzes/date : internal server error" });
  }
};

export const getTodayAnswerHandler: RequestHandler = async (req, res) => {
  try {
    // 로그인된 사용자 정보 가져오기
    const userId = req.userOid;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(startOfToday.getDate() + 1);

    // 오늘의 퀴즈 조회
    const quiz = await quizModel
      .findOne({
        quizDate: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      })
      .lean();

    if (!quiz) {
      return res.status(404).json({ message: "No quiz available for today." });
    }

    // 사용자의 오늘 제출된 답안 찾기
    const userAnswer = quiz.answers.find(
      (answer) => answer.userId.toString() === userId.toString()
    );

    if (!userAnswer) {
      return res.status(404).json({ message: "No answer found for today." });
    }

    const response = {
      quizDate: quiz.quizDate,
      userId: userId,
      answer: userAnswer.answer,
      submittedAt: userAnswer.submittedAt,
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ error: "Quizzes/todayAnswer : internal server error" });
  }
};

export const getAllAnswersHandler: RequestHandler = async (req, res) => {
  try {
    // 로그인된 사용자 정보 가져오기
    const userId = req.userOid;

    // 모든 퀴즈에서 사용자의 답안 조회
    const quizzes = await quizModel
      .find({
        "answers.userId": userId,
      })
      .lean();

    if (quizzes.length === 0) {
      return res
        .status(404)
        .json({ message: "No answers found for this user." });
    }

    // 사용자의 답안을 정리해서 응답으로 반환
    const userAnswers = quizzes.flatMap((quiz) =>
      quiz.answers
        .filter((answer) => answer.userId.toString() === userId.toString())
        .map((answer) => ({
          quizDate: quiz.quizDate,
          answer: answer.answer,
          status: answer.status || "unknown",
          submittedAt: answer.submittedAt,
        }))
    );

    const response = {
      userId: userId,
      answers: userAnswers,
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Quizzes/answers : internal server error" });
  }
};

export const submitAnswerHandler: RequestHandler = async (req, res) => {
  try {
    // 로그인된 사용자 정보 가져오기
    const userId = req.userOid;
    const { answer } = req.body;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(startOfToday.getDate() + 1);

    // 오늘의 퀴즈 조회
    const quiz = await quizModel.findOne({
      quizDate: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: "No quiz available for today." });
    }

    // 사용자가 이미 답안을 제출했는지 확인
    const existingAnswer = quiz.answers.some(
      (answer) => answer.userId.toString() === userId.toString()
    );
    if (existingAnswer) {
      return res
        .status(409)
        .json({ message: "You have already submitted an answer for today." });
    }

    // 답안 제출 기록 추가
    const submittedAt = new Date();
    await quizModel.updateOne(
      { _id: quiz._id },
      {
        $push: {
          answers: {
            userId, // 로그인된 사용자 ID 추가
            answer,
            submittedAt,
            status: "unknown",
          },
        },
        $inc: {
          countA: answer === "A" ? 1 : 0, // A 선택 시 count 증가
          countB: answer === "B" ? 1 : 0, // B 선택 시 count 증가
        },
      }
    );

    return res.status(200).json({
      message: "Answer submitted successfully",
      submittedAt: submittedAt.toISOString(),
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Quizzes/submit : internal server error" });
  }
};

export const cancelAnswerHandler: RequestHandler = async (req, res) => {
  try {
    // 로그인된 사용자 정보 가져오기
    const userId = req.userOid;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(startOfToday.getDate() + 1);

    // 오늘의 퀴즈 조회
    const quiz = await quizModel.findOne({
      quizDate: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: "No quiz available for today." });
    }

    // 사용자의 제출된 답안 찾기
    const userAnswer = quiz.answers.find(
      (answer) => answer.userId.toString() === userId.toString()
    );

    if (!userAnswer) {
      return res
        .status(404)
        .json({ message: "No answer found for cancellation." });
    }

    // 답안 제거 및 count 감소 (MongoDB의 $pull 및 $inc 사용)
    await quizModel.updateOne(
      { _id: quiz._id },
      {
        $pull: { answers: { userId } }, // 사용자의 답안을 배열에서 제거
        $inc: {
          countA: userAnswer.answer === "A" ? -1 : 0, // A 선택 취소 시 count 감소
          countB: userAnswer.answer === "B" ? -1 : 0, // B 선택 취소 시 count 감소
        },
      }
    );

    return res.status(200).json({ message: "Answer canceled successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Quizzes/cancel : internal server error" });
  }
};
