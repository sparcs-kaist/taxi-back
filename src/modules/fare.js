const axios = require("axios");
const logger = require("./logger");

const { naverMap } = require("../../loadenv");
const { taxiFareModel, locationModel } = require("./stores/mongo");

const naverMapApi = {
  "X-NCP-APIGW-API-KEY-ID": naverMap.naverMapApiId,
  "X-NCP-APIGW-API-KEY": naverMap.naverMapApiKey,
};
const naverMapApiCall =
  "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=";

const timeConstants = 48;

const scaledTime = (time) => {
  return (
    timeConstants * time.getDay() +
    time.getHours() * 2 +
    (time.getMinutes() >= 30 ? 1 : 0)
  );
};

const initDatabase = async () => {
  try {
    if (
      naverMapApi["X-NCP-APIGW-API-KEY"] === false ||
      naverMapApi["X-NCP-APIGW-API-KEY-ID"] === false
    ) {
      logger.error(
        "There is no credential for Naver Map. Taxi Fare functions are disabled."
      );
      return;
    }
    const location = await locationModel.find({ isValid: { $eq: true } });
    location.map(async (from) => {
      location.reduce(async (acc, to) => {
        await acc;
        if (from._id === to._id) return;
        let tableFare = [];
        const prevTaxiFare = (
          await taxiFareModel
            .findOne(
              {
                from: from._id,
                to: to._id,
              },
              { fare: true }
            )
            .clone()
        ).fare;
        const fare = prevTaxiFare
          ? prevTaxiFare
          : (
              await axios.get(
                `${
                  naverMapApiCall + from.longitude + "," + from.latitude
                }&goal=${to.longitude + "," + to.latitude}&options=traoptimal`,
                { headers: naverMapApi }
              )
            ).data.route.traoptimal[0].summary.taxiFare;
        if (from.koName === "카이스트 본원" && to.koName === "대전역") {
          [...Array(timeConstants * 7)].map((_, i) => {
            tableFare.push({
              updateOne: {
                filter: { from: from._id, to: to._id, time: i, isMajor: true },
                update: {
                  $setOnInsert: {
                    fare: fare,
                  },
                },
                upsert: true,
              },
            });
          });
        } else if (from.koName === "대전역" && to.koName === "카이스트 본원") {
          [...Array(timeConstants * 7)].map((_, i) => {
            tableFare.push({
              updateOne: {
                filter: { from: from._id, to: to._id, time: i, isMajor: true },
                update: {
                  $setOnInsert: {
                    fare: fare,
                  },
                },
                upsert: true,
              },
            });
          });
        } else {
          [...Array(7)].map((_, i) => {
            tableFare.push({
              updateOne: {
                filter: {
                  from: from._id,
                  to: to._id,
                  time: i * timeConstants,
                  isMajor: false,
                },
                update: {
                  $setOnInsert: {
                    fare: fare,
                  },
                },
                upsert: true,
              },
            });
          });
        }
        await taxiFareModel.bulkWrite(tableFare);
        await new Promise((resolve) => setTimeout(resolve, 200));
        return acc;
      }, Promise.resolve());
    });
  } catch (err) {
    logger.error("Error occured while initializing database: " + err.message);
  }
};

module.exports = { scaledTime, initDatabase };
