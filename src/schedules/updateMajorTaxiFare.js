const { scaledTime } = require("../modules/fare");
const { updateTaxiFare } = require("../services/fare");

/* 카이스트 본원<-> 대전역 경로에 대한 택시 요금을 매 30분간격(매시 0분과 30분)으로 캐싱합니다. */
module.exports = (app) => async () => {
  try {
    start = "카이스트 본원";
    goal = "대전역";
    time = new Date();
    sTime = scaledTime(time);
    await updateTaxiFare(start, goal, sTime);
    await updateTaxiFare(goal, start, sTime);
  } catch (err) {
    console.log(err);
  }
};
