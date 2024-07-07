import logger from "../modules/logger";

import { updateTaxiFare } from "../services/fare";
import { scaledTime } from "../modules/fare";

/* 카이스트 본원<-> 대전역 경로에 대한 택시 요금을 매 30분간격(매시 0분과 30분)으로 1주일 단위 캐싱합니다. */
export default (app: any): any =>
  async (): Promise<void> => {
    try {
      const time: Date = new Date();
      const sTime: number = scaledTime(time);
      await updateTaxiFare(sTime, true);
    } catch (err) {
      logger.error(err);
    }
  };
