import { quizModel } from "../modules/stores/mongo";

/**
 * 특정 날짜의 퀴즈를 조회하는 함수
 */
export const getQuizByDate = async (date: Date) => {
  const todayMidnight = new Date(date);
  todayMidnight.setHours(0, 0, 0, 0);

  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(todayMidnight.getDate() + 1);

  return await quizModel.findOne({
    quizDate: {
      $gte: todayMidnight,
      $lt: tomorrowMidnight,
    },
  });
};
