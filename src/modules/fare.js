const logger = require("./logger");
const axios = require("axios");

const { naverMapApiId, naverMapApiKey } = require("../../loadenv");
const { taxiFareModel, locationModel } = require("../modules/stores/mongo");

// Naver Cloud Platform Maps Directions 5 API Keys
const naverMapApi = {
  "X-NCP-APIGW-API-KEY-ID": naverMapApiId,
  "X-NCP-APIGW-API-KEY": naverMapApiKey,
};
const naverMapApiCall =
  "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=";

// scaledTime에 사용하는 상수입니다. 0 ~ 47 (0:00 ~ 23:30)
const timeConstants = 48;

/**
 * 시간을 받아서 30분 단위로 변환해서 반환합니다.
 * 요일 정보도 하나로 관리
 * @summary 0 ~ 6 (Sunday~Saturday) * 48 + 0 ~ 47 (0:00 ~ 23:30))
 * @param {Date} time 변환할 시간
 */
const scaledTime = (time) => {
  return (
    timeConstants * time.getDay() +
    time.getHours() * 2 +
    (time.getMinutes() >= 30 ? 1 : 0)
  );
};

/**  Initialize database
 * 1. Erase all previous data
 * 2. Sets all taxi fare to 0
 * @summary 카이스트 본원 <-> 대전역의 경우 48 * 7개의 시간대에 대한 택시 요금을 init 시점의 비용으로 설정합니다.
 * @summary 카이스트 본원 <-> 대전역 외 나머지 경로, 238개의 경로에 대해서는 한 개의 collection씩 설정하여 fare를 init 시점의 비용으로 설정합니다. time은 0으로 설정합니다.
 */
const initDatabase = async () => {
  try {
    if (
      !naverMapApi["X-NCP-APIGW-API-KEY"] ||
      !naverMapApi["X-NCP-APIGW-API-KEY-ID"]
    ) {
      logger.log(
        "There is no credential for Naver Map. Taxi Fare functions are disabled."
      );
      return;
    }
    // Remove all previous data
    await taxiFareModel.deleteMany({});

    const location = await locationModel.find({ isValid: { $eq: true } });

    location.map(async (from) => {
      location.reduce(async (acc, to) => {
        logger.info(`Initializing fare from ${from.koName} to ${to.koName}`);
        await acc;
        if (from._id === to._id) return;
        let tableFare = [];
        // 카이스트 본원 <-> 대전역의 경우 48*7(=336)개의 시간대에 대한 택시 요금을 일괄적으로 설정
        if (from.koName === "카이스트 본원" && to.koName === "대전역") {
          const fare = (
            await axios.get(
              `${naverMapApiCall + from.longitude + "," + from.latitude}&goal=${
                to.longitude + "," + to.latitude
              }&options=traoptimal`,
              { headers: naverMapApi }
            )
          ).data.route.traoptimal[0].summary.taxiFare;
          [...Array(timeConstants * 7)].map((_, i) => {
            tableFare.push({
              from: from._id,
              to: to._id,
              time: i,
              fare: fare,
              isMajor: true,
            });
          });
        } else if (from.koName === "대전역" && to.koName === "카이스트 본원") {
          const fare = (
            await axios.get(
              `${naverMapApiCall + from.longitude + "," + from.latitude}&goal=${
                to.longitude + "," + to.latitude
              }&options=traoptimal`,
              { headers: naverMapApi }
            )
          ).data.route.traoptimal[0].summary.taxiFare;
          [...Array(timeConstants * 7)].map((_, i) => {
            tableFare.push({
              from: from._id,
              to: to._id,
              time: i,
              fare: fare,
              isMajor: true,
            });
          });
        }
        // 카이스트 본원 <-> 대전역외의 경로(238개)에 대해서는 7개(일주일) 씩 collection 지정 설정
        else {
          await axios
            .get(
              `${naverMapApiCall + from.longitude + "," + from.latitude}&goal=${
                to.longitude + "," + to.latitude
              }&options=traoptimal`,
              { headers: naverMapApi }
            )
            .then((res) => {
              [...Array(7)].map((_, i) => {
                tableFare.push({
                  from: from,
                  to: to,
                  time: i * timeConstants,
                  fare: res.data.route.traoptimal[0].summary.taxiFare,
                  isMajor: false,
                });
              });
            })
            .catch((err) => {
              logger.error(err.message);
              [...Array(7)].map((_, i) => {
                tableFare.push({
                  from: from,
                  to: to,
                  time: i * timeConstants,
                  fare: 0,
                  isMajor: false,
                });
              });
            });
        }
        await taxiFareModel.insertMany(tableFare);
        await new Promise((resolve) => setTimeout(resolve, 200));
        return acc;
      }, Promise.resolve());
    });
  } catch (err) {
    logger.error("Error occured while initializing database: " + err.message);
  }
};

module.exports = { scaledTime, initDatabase };
