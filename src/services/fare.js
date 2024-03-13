const axios = require("axios");

const { naverCloudApiId, naverCloudApiKey } = require("../../loadenv");
const { taxiFareModel, locationModel } = require("../modules/stores/mongo");
const { scaledTime } = require("../modules/fare");
const logger = require("../modules/logger");

// Naver Cloud Platform Maps Directions 5 API Keys
const naverCloudApi = {
  "X-NCP-APIGW-API-KEY-ID": naverCloudApiId,
  "X-NCP-APIGW-API-KEY": naverCloudApiKey,
};
const naverCloudApiCall =
  "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=";

/**  Initialize database
 * 1. Erase all previous data
 * 2. Sets all taxi fare to 0
 * @summary 카이스트 본원 <-> 대전역의 경우 48 * 7개의 시간대에 대한 택시 요금을 init 시점의 비용으로 설정합니다.
 * @summary 카이스트 본원 <-> 대전역 외 나머지 경로, 238개의 경로에 대해서는 한 개의 collection씩 설정하여 fare를 init 시점의 비용으로 설정합니다. time은 0으로 설정합니다.
 */
const initDatabase = async (req, res) => {
  try {
    // Remove all previous data
    await taxiFareModel.deleteMany({});

    const location = await locationModel
      .find({ isValid: { $ne: false } })
      .toArray();

    location.map((start) => {
      location.map(async (goal) => {
        if (start._id === goal._id) return;
        let tableFare = [];
        // 카이스트 본원 <-> 대전역의 경우 48*7(=336)개의 시간대에 대한 택시 요금을 일괄적으로 설정
        if (start.koName === "카이스트 본원" && goal.koName === "대전역") {
          const fare = (
            await axios.get(
              `${
                naverCloudApiCall + start.longitude + "," + start.latitude
              }&goal=${
                goal.longitude + "," + goal.latitude
              }&options=traoptimal`,
              { headers: naverCloudApi }
            )
          ).data.route.traoptimal[0].summary.taxiFare;
          [...Array(48 * 7)].map((_, i) => {
            tableFare.push({
              start: start._id,
              goal: goal._id,
              time: i,
              fare: fare,
              isMajor: true,
            });
          });
        } else if (
          start.koName === "대전역" &&
          goal.koName === "카이스트 본원"
        ) {
          const fare = (
            await axios.get(
              `${
                naverCloudApiCall + start.longitude + "," + start.latitude
              }&goal=${
                goal.longitude + "," + goal.latitude
              }&options=traoptimal`,
              { headers: naverCloudApi }
            )
          ).data.route.traoptimal[0].summary.taxiFare;
          [...Array(48 * 7)].map((_, i) => {
            tableFare.push({
              start: start._id,
              goal: goal._id,
              time: i,
              fare: fare,
              isMajor: true,
            });
          });
        }
        // 카이스트 본원 <-> 대전역외의 경로(238개)에 대해서는 7개(일주일) 씩 collection 지정 설정
        else {
          [...Array(7)].map((_, i) => {
            tableFare.push({
              start: start,
              goal: goal,
              time: i * 48,
              fare: 0,
              isMajor: false,
            });
          });
        }
        await taxiFareModel.insertMany(tableFare);
      });
    });
    res.status(200).send("TaxiFare Database initialized");
  } catch (err) {
    res.status(500).json({ error: "fare/init: TaxiFare Database failed" });
  }
};

/**
 * 주어진 start, goal, time에 대한 택시 요금을 반환합니다.
 * @summary 카이스트 본원 <-> 대전역의 경로를 제외한 다른 경로의 경우, 1주일 전 매일 18:00시의 택시 요금을 반환합니다.
 * @summary 카이스트 본원 <-> 대전역의 경우, cron으로 1주일 전 미리 캐싱해놓은 데이터를 기반으로 주어진 시간에 대한 택시 요금을 반환합니다. 만일, 해당 데이터가 존재하지 않을 경우에는 직접 호출해 보여줍니다.
 * @param {Request} req - 파라미터로 start, goal, time을 받습니다.
 *  - @param {mongoose.Schema.Types.ObjectId} start - 출발지
 *  - @param {mongoose.Schema.Types.ObjectId} goal - 도착지
 *  - @param {Date} time - 출발 시간 (ISO 8601)
 */
const getTaxiFare = async (req, res) => {
  try {
    const start = await locationModel.findOne({
      _id: { $eq: req.query.start },
    });
    const goal = await locationModel
      .findOne({ _id: { $eq: req.query.goal } })
      .clone();
    const sTime = scaledTime(new Date(req.query.time));

    if (!start || !goal) {
      res.status(400).json({ error: "fare/getTaxiFare: Wrong location" });
    }

    // 카이스트 본원 <-> 대전역
    if (
      (start.koName === "카이스트 본원" && goal.koName === "대전역") ||
      (start.koName === "대전역" && goal.koName === "카이스트 본원")
    ) {
      const taxiFare = await taxiFareModel
        .findOne(
          {
            start: start._id,
            goal: goal._id,
            time: sTime,
            isMajor: true,
          },
          function (err, docs) {
            if (err)
              logger.error(
                "Error occured while finding TaxiFare documents: " + err.message
              );
          }
        )
        .clone();
      //만일 cron이 아직 돌지 않은 상태의 시간대의 정보를 필요로하는 비상시의 경우 대비
      if (!taxiFare || taxiFare.fare === 0) {
        const fare = (
          await axios.get(
            `${
              naverCloudApiCall + start.longitude + "," + start.latitude
            }&goal=${goal.longitude + "," + goal.latitude}&options=traoptimal`,
            { headers: naverCloudApi }
          )
        ).data.route.traoptimal[0].summary.taxiFare;
        res.status(200).send(fare);
      } else {
        res.status(200).send(taxiFare.fare);
      }
    }
    // 카이스트 본원 <-> 대전역이 아닌 경우
    else {
      const taxiFare = await taxiFareModel
        .findOne(
          {
            start: start._id,
            goal: goal._id,
            time: 0,
            isMajor: false,
          },
          function (err, docs) {
            if (err)
              logger.error(
                "Error occured while finding TaxiFare documents: " + err.message
              );
          }
        )
        .clone();
      //만일 cron이 아직 돌지 않은 상태의 시간대의 정보를 필요로하는 비상시의 경우 대비
      if (!taxiFare || taxiFare.fare === 0) {
        const fare = (
          await axios.get(
            `${
              naverCloudApiCall + start.longitude + "," + start.latitude
            }&goal=${goal.longitude + "," + goal.latitude}&options=traoptimal`,
            { headers: naverCloudApi }
          )
        ).data.route.traoptimal[0].summary.taxiFare;
        res.status(200).send(fare);
      } else {
        res.status(200).send(taxiFare.fare);
      }
    }
  } catch (err) {
    logger.error("Failed with exception: " + err.message);
    res
      .status(500)
      .json({ error: "fare/getTaxiFare: Failed to load taxi fare" });
  }
};

/**
 * 주어진 start, goal, sTime에 대한 단일 택시 요금을 업데이트합니다.
 * @summary 카이스트 본원 <-> 대전역의 경로를 제외한 다른 경로의 경우, cron에 의해 매일 18:00시의 택시 요금을 업데이트 하게 됩니다.
 * @summary 카이스트 본원 <-> 대전역의 경우, 미리 캐싱해놓은 데이터를 기반으로 주어진 시간(30분 간격)에 대한 택시 요금을 반환합니다.
 * @param {Date} sTime - 출발 시간 (scaledTime에 의해 변경된 시간, 0 ~ 6 (Sunday~Saturday) * 48 + 0 ~ 47 (0:00 ~ 23:30))
 * @param {Boolean} isMajor - 카이스트 본원 <-> 대전역 여부
 */
const updateTaxiFare = async (sTime, isMajor) => {
  const prevFare = await taxiFareModel.findOne({
    time: sTime,
    isMajor: isMajor,
  });
  prevFare.map(async (item) => {
    const start = await locationModel.findOne({ _id: item.start });
    const goal = await locationModel.findOne({ _id: item.goal });
    const fare = (
      await axios.get(
        `${naverCloudApiCall + start.longitude + "," + start.latitude}&goal=${
          goal.longitude + "," + goal.latitude
        }&options=traoptimal`,
        { headers: naverCloudApi }
      )
    ).data.route.traoptimal[0].summary.taxiFare;
    await taxiFareModel.updateOne(
      { start: item.start, goal: item.goal, time: sTime },
      { fare: fare },
      function (err, docs) {
        if (err)
          logger.error(
            "Error occured while updating TaxiFare document: " + err.message
          );
      }
    );
  });
};

module.exports = {
  initDatabase,
  getTaxiFare,
  updateTaxiFare,
};
