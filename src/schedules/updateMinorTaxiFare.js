const logger = require("../modules/logger").default;

const { updateTaxiFare } = require("../modules/fare");

/* 카이스트 본원<-> 대전역 경로 외의 238개 경로에 대한 택시 요금을 매일 18:00시에 1주일 단위로 캐싱합니다. */
module.exports = (app) => async () => {
  try {
    const date = new Date();
    await updateTaxiFare(48 * date.getDay(), false); // 18:00시의 택시 요금이지만 db에는 48*(요일) + 0으로 저장됨
  } catch (err) {
    logger.error(err);
  }
};
