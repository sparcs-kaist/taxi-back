/*
 * 시간을 받아서 30분 단위로 변환해서 반환합니다.
 * 00:00 ~ 23:59 -> 0 ~ 47
 * @param {Date} time 변환할 시간
 */
const scaledTime = (time) => {
  return time.getHours() * 2 + (time.getMinutes() >= 30 ? 1 : 0);
};

module.exports = { scaledTime };
