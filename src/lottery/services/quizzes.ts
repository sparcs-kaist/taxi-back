import { RequestHandler } from "express";
import { quizModel } from "../modules/stores/mongo";
import logger from "@/modules/logger";
import { getQuizByDate } from "../modules/quizzes";

export const getTodayQuizHandler: RequestHandler = async (req, res) => {
  try {
    const quiz = await getQuizByDate(new Date(req.timestamp!));
    console.log("Hello");
    if (!quiz) {
      return res.status(404).json({ message: "No quiz found for today" });
    }

    // content를 "/" 기준으로 split
    const contentParts = quiz.content.split("/");
    const optionA = contentParts.length > 1 ? contentParts[0] : null;
    const optionB = contentParts.length > 2 ? contentParts[1] : null;
    const quizContent =
      contentParts.length > 2 ? contentParts[2] : quiz.content;

    const totalCount = quiz.countA + quiz.countB; // quizCount

    const response = {
      quizDate: quiz.quizDate,
      quizTitle: quiz.title,
      quizContent: quizContent,
      quizImage: quiz.image,
      quizCount: totalCount,
      optionA: optionA || "Option A", // 기본값 설정
      optionB: optionB || "Option B",
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: "Quizzes/today : internal server error" });
  }
};

export const getQuizByDateHandler: RequestHandler = async (req, res) => {
  try {
    const { date } = req.params;

    const [year, month, day] = date.split("-").map(Number);
    const requestedDate = new Date(year, month - 1, day);

    const startOfToday = new Date(req.timestamp!);
    startOfToday.setHours(0, 0, 0, 0);

    // 미래 날짜 조회 제한
    if (requestedDate >= startOfToday) {
      return res
        .status(403)
        .json({ message: "You cannot access future quizzes." });
    }

    const startOfDate = new Date(year, month - 1, day, 0, 0, 0);

    const quiz = await getQuizByDate(startOfDate);

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

    // content를 "/" 기준으로 split
    const contentParts = quiz.content.split("/");
    const optionA = contentParts.length > 1 ? contentParts[0] : null;
    const optionB = contentParts.length > 2 ? contentParts[1] : null;
    const quizContent =
      contentParts.length > 2 ? contentParts[2] : quiz.content;

    const response = {
      quizDate: quiz.quizDate,
      quizTitle: quiz.title,
      quizImage: quiz.image,
      quizContent: quizContent,
      quizCount: totalCount,
      answer: quiz.answer,
      pickRatio: pickRatio,
      optionA: optionA || "Option A", // 기본값 설정
      optionB: optionB || "Option B",
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: "Quizzes/date : internal server error" });
  }
};

export const getTodayAnswerHandler: RequestHandler = async (req, res) => {
  try {
    // 로그인된 사용자 정보 가져오기
    const userId = req.userOid;

    const quiz = await getQuizByDate(new Date(req.timestamp!));

    if (!quiz) {
      return res.status(404).json({ message: "No quiz available for today." });
    }

    // 사용자의 오늘 제출된 답안 찾기
    const userAnswer = quiz.answers.find(
      (answer: any) => answer.userId.toString() === userId?.toString()
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
    const userAnswers = quizzes.flatMap((quiz: any) =>
      quiz.answers
        .filter(
          (answer: any) => answer.userId.toString() === userId?.toString()
        )
        .map((answer: any) => ({
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
    return res
      .status(500)
      .json({ error: "Quizzes/answers : internal server error" });
  }
};

export const submitAnswerHandler: RequestHandler = async (req, res) => {
  try {
    // 로그인된 사용자 정보 가져오기
    const userId = req.userOid;
    const { answer } = req.body;

    const timestamp = new Date(req.timestamp!);
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();

    // 23시 55분 이후 취소 금지
    if (hours === 23 && minutes > 55) {
      return res.status(404).json({ message: "You can't submit answer now." });
    }

    const quiz = await getQuizByDate(new Date(req.timestamp!));

    if (!quiz) {
      return res.status(404).json({ message: "No quiz available for today." });
    }

    // 사용자가 이미 답안을 제출했는지 확인
    const existingAnswer = quiz.answers.some(
      (answer: any) => answer.userId.toString() === userId?.toString()
    );
    if (existingAnswer) {
      return res
        .status(409)
        .json({ message: "You have already submitted an answer for today." });
    }

    // 답안 제출 기록 추가
    const submittedAt = new Date(req.timestamp!);
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
    return res
      .status(500)
      .json({ error: "Quizzes/submit : internal server error" });
  }
};

export const cancelAnswerHandler: RequestHandler = async (req, res) => {
  try {
    // 로그인된 사용자 정보 가져오기
    const userId = req.userOid;

    const timestamp = new Date(req.timestamp!);
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();

    // 23시 55분 이후 취소 금지
    if (hours === 23 && minutes > 55) {
      return res.status(404).json({ message: "You can't submit answer now." });
    }

    const quiz = await getQuizByDate(new Date(req.timestamp!));

    if (!quiz) {
      return res.status(404).json({ message: "No quiz available for today." });
    }

    // 사용자의 제출된 답안 찾기
    const userAnswer = quiz.answers.find(
      (answer: any) => answer.userId.toString() === userId?.toString()
    );

    if (!userAnswer) {
      return res
        .status(200)
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
    return res
      .status(500)
      .json({ error: "Quizzes/cancel : internal server error" });
  }
};
