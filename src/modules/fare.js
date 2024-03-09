/**
 * 시간을 받아서 30분 단위로 변환해서 반환합니다.
 * 요일 정보도 하나로 관리
 * @summary 0 ~ 6 (Sunday~Saturday) * 48 + 0 ~ 47 (0:00 ~ 23:30))
 * @param {Date} time 변환할 시간
 */
const scaledTime = (time) => {
  return (
    48 * time.getDay() + time.getHours() * 2 + (time.getMinutes() >= 30 ? 1 : 0)
  );
};

module.exports = { scaledTime };
