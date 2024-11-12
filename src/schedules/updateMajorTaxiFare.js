const logger = require("../modules/logger");

const { scaledTime, updateTaxiFare } = require("../modules/fare");

/* 카이스트 본원<-> 대전역 경로에 대한 택시 요금을 매 30분간격(매시 0분과 30분)으로 1주일 단위 캐싱합니다. */
module.exports = (app) => async () => {
  try {
    const time = new Date();
    const sTime = scaledTime(time);
    await updateTaxiFare(sTime, true);
  } catch (err) {
    logger.error(err);
  }
};
