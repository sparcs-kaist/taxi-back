const { updateTaxiFare } = require("../services/fare");
const locations = require("../locations.json"); //TODO: Change Location style of taxi-fare to match taxi-back

/* 카이스트 본원<-> 대전역 경로 외의 238개 경로에 대한 택시 요금을 매일 18:00시에 캐싱합니다. */
module.exports = (app) => async () => {
  try {
    for (let locStart in locations) {
      for (let locGoal in locations) {
        if (locStart === locGoal) continue;
        if (
          (locStart === "카이스트 본원" && locGoal === "대전역") ||
          (locStart === "대전역" && locGoal === "카이스트 본원")
        )
          continue;
        else {
          await updateTaxiFare(locStart, locGoal, 0); //18:00시의 택시 요금이지만 db에는 0으로 저장됨
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
};
