import { Request, Response } from "express";
import { quizModel } from "../modules/stores/mongo";
import { getLoginInfo } from "@/modules/auths/login";

export const getTodayQuiz = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9 오프셋
    const kstNow = new Date(now.getTime() + kstOffset);

    const startOfToday = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate(),
        0,
        1,
        0
      )
    );
    const endOfToday = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate(),
        23,
        59,
        59
      )
    );

    // 오늘의 퀴즈 조회
    const quiz = await quizModel.findOne({
      quizDate: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

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
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getQuizByDate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { date } = req.params;

    // 날짜 유효성 검사 (YYYY-MM-DD 형식)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    const requestedDate = new Date(`${date}T00:00:00Z`);

    // KST 기준으로 오늘 자정 설정
    const kstNow = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
    const kstToday = new Date(kstNow.getTime() + kstOffset);
    kstToday.setUTCHours(0, 0, 0, 0); // KST 기준 오늘 0시 0분 0초로 설정

    // 미래 날짜 조회 제한
    if (requestedDate > kstToday) {
      return res
        .status(403)
        .json({ message: "You cannot access future quizzes." });
    }

    const startOfDate = new Date(`${date}T00:00:00Z`);
    const endOfDate = new Date(`${date}T23:59:59Z`);

    // 해당 날짜의 퀴즈 조회
    const quiz = await quizModel.findOne({
      quizDate: {
        $gte: startOfDate,
        $lt: endOfDate,
      },
    });

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
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTodayAnswer = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // 로그인된 사용자 정보 가져오기
    const user = getLoginInfo(req);
    if (!user.oid) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No valid session found" });
    }

    const userId = user.oid;

    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const startOfToday = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate(),
        0,
        1,
        0
      )
    );
    const endOfToday = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate(),
        23,
        59,
        59
      )
    );

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

    // 사용자의 오늘 제출된 답안 찾기
    const userAnswer = quiz.answers.find(
      (answer: any) => answer.userId.toString() === userId.toString()
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
    console.error("Error fetching today's answer:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllAnswers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // 로그인된 사용자 정보 가져오기
    const user = getLoginInfo(req);
    if (!user.oid) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No valid session found" });
    }

    const userId = user.oid;

    // 모든 퀴즈에서 사용자의 답안 조회
    const quizzes = await quizModel.find({
      "answers.userId": userId,
    });

    if (quizzes.length === 0) {
      return res
        .status(404)
        .json({ message: "No answers found for this user." });
    }

    // 사용자의 답안을 정리해서 응답으로 반환
    const userAnswers = quizzes.flatMap((quiz: any) =>
      quiz.answers
        .filter((answer: any) => answer.userId.toString() === userId.toString())
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
    console.error("Error fetching all answers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const submitAnswer = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // 로그인된 사용자 정보 가져오기
    const user = getLoginInfo(req);
    if (!user.oid) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No valid session found" });
    }

    const userId = user.oid; // 사용자 고유 ID
    const { answer } = req.body;

    // 답안 유효성 검사 (A 또는 B만 허용)
    if (!["A", "B"].includes(answer)) {
      return res
        .status(400)
        .json({ message: "Invalid answer. Only 'A' or 'B' is allowed." });
    }

    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const startOfToday = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate(),
        0,
        1,
        0
      )
    );
    const endOfToday = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate(),
        23,
        59,
        59
      )
    );

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
    console.error("Error submitting answer:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const cancelAnswer = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // 로그인된 사용자 정보 가져오기
    const user = getLoginInfo(req);
    if (!user.oid) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No valid session found" });
    }

    const userId = user.oid;

    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const startOfToday = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate(),
        0,
        1,
        0
      )
    );
    const endOfToday = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate(),
        23,
        59,
        59
      )
    );

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
      (answer: any) => answer.userId.toString() !== userId.toString()
    );

    if (quiz.answers.length === initialAnswersLength) {
      return res
        .status(404)
        .json({ message: "No answer found for cancellation." });
    }

    // countA 또는 countB 감소
    quiz.countA = quiz.answers.filter((a: any) => a.answer === "A").length;
    quiz.countB = quiz.answers.filter((a: any) => a.answer === "B").length;

    await quiz.save(); // 변경 사항 저장

    return res.status(200).json({ message: "Answer canceled successfully" });
  } catch (error) {
    console.error("Error canceling answer:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
