import { RequestHandler } from "express";
import { quizModel } from "../modules/stores/mongo";
import logger from "@/modules/logger";

export const getTodayQuiz: RequestHandler = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
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
    logger.error(err);
    res.status(500).json({ error: "Quizzes/today : internal server error" });
  }
};

export const getQuizByDate: RequestHandler = async (req, res) => {
  try {
    const { date } = req.params;

    const requestedDate = new Date(`${date}T00:00:00Z`);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 미래 날짜 조회 제한
    if (requestedDate > startOfToday) {
      return res
        .status(403)
        .json({ message: "You cannot access future quizzes." });
    }

    const startOfDate = new Date(`${date}T00:00:00Z`);
    const endOfDate = new Date(`${date}T23:59:59Z`);

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
    logger.error(err);
    res.status(500).json({ error: "Quizzes/date : internal server error" });
  }
};

export const getTodayAnswer: RequestHandler = async (req, res) => {
  try {
    // 로그인된 사용자 정보 가져오기
    const userId = req.userOid;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
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
    logger.error(err);
    res
      .status(500)
      .json({ error: "Quizzes/todayAnswer : internal server error" });
  }
};

export const getAllAnswers: RequestHandler = async (req, res) => {
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
    logger.error(err);
    res.status(500).json({ error: "Quizzes/answers : internal server error" });
  }
};

export const submitAnswer: RequestHandler = async (req, res) => {
  try {
    // 로그인된 사용자 정보 가져오기
    const userId = req.userOid;
    const { answer } = req.body;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
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
    quiz.answers.push({
      userId, // 로그인된 사용자 ID 추가
      answer,
      submittedAt,
      status: "unknown",
    });

    // 선택된 답에 따라 count 증가
    if (answer === "A") quiz.countA++;
    if (answer === "B") quiz.countB++;

    await quiz.save(); // 변경 사항 저장

    return res.status(200).json({
      message: "Answer submitted successfully",
      submittedAt: submittedAt.toISOString(),
    });
  } catch (error) {
    logger.error(err);
    res.status(500).json({ error: "Quizzes/submit : internal server error" });
  }
};

export const cancelAnswer: RequestHandler = async (req, res) => {
  try {
    // 로그인된 사용자 정보 가져오기
    const userId = req.userOid;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
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

    // 사용자의 제출된 답안을 찾고 삭제
    const initialAnswersLength = quiz.answers.length;
    quiz.answers = quiz.answers.filter(
      (answer) => answer.userId.toString() !== userId.toString()
    );

    if (quiz.answers.length === initialAnswersLength) {
      return res
        .status(404)
        .json({ message: "No answer found for cancellation." });
    }

    // countA 또는 countB 감소
    quiz.countA = quiz.answers.filter((a) => a.answer === "A").length;
    quiz.countB = quiz.answers.filter((a) => a.answer === "B").length;

    await quiz.save(); // 변경 사항 저장

    return res.status(200).json({ message: "Answer canceled successfully" });
  } catch (error) {
    logger.error(err);
    res.status(500).json({ error: "Quizzes/cancel : internal server error" });
  }
};
