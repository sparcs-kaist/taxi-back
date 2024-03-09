const axios = require("axios");

const { naverCloudApiId, naverCloudApiKey } = require("../../loadenv");
const { taxiFareModel, locationModel } = require("../modules/stores/mongo");
const { scaledTime } = require("../modules/fare");

// Naver Cloud Platform Maps Directions 5 API Keys
const naverCloudApi = {
  "X-NCP-APIGW-API-KEY-ID": naverCloudApiId,
  "X-NCP-APIGW-API-KEY": naverCloudApiKey,
};

/**  Initialize database
 * 1. Erase all previous data
 * 2. Sets all taxi fare to 0
 * @summary 카이스트 본원 <-> 대전역의 경우 48 * 7개의 시간대에 대한 택시 요금을 0으로 설정합니다.
 * @summary 카이스트 본원 <-> 대전역 외 나머지 경로, 238개의 경로에 대해서는 한 개의 collection씩 설정하여 fare를 0으로 설정합니다. time은 0으로 설정합니다.
 */
const initDatabase = async (req, res) => {
  try {
    // Remove all previous data
    await taxiFareModel.deleteMany({});

    const location = (
      await locationModel.find({ isValid: { $ne: false } }, "koName")
    ).map((location) => location.koName);

    for (let skey in location) {
      for (let gkey in location) {
        if (skey === gkey) continue;
        let tableFare = [];
        // 카이스트 본원 <-> 대전역의 경우 48*7(=336)개의 시간대에 대한 택시 요금을 0으로 설정
        if (
          (skey === "카이스트 본원" && gkey === "대전역") ||
          (skey === "대전역" && gkey === "카이스트 본원")
        ) {
          for (let i = 0; i < 336; i++) {
            tableFare.push({
              start: skey,
              goal: gkey,
              time: i,
              fare: 0,
            });
          }
        }
        // 카이스트 본원 <-> 대전역외의 경로(238개)에 대해서는 7개(일주일) 씩 collection 지정 설정
        else {
          for (let i = 0; i < 7; i++) {
            tableFare.push({
              start: skey,
              goal: gkey,
              time: i * 48,
              fare: 0,
            });
          }
        }
        await taxiFareModel.insertMany(tableFare);
      }
    }
    res.state(200).json({ message: "TaxiFare Database initialized" });
  } catch (err) {
    res.status(500).json({ error: "Failed with exception " + err.message });
  }
};

/**
 * 주어진 start, goal, time에 대한 택시 요금을 반환합니다.
 * @summary 카이스트 본원 <-> 대전역의 경로를 제외한 다른 경로의 경우, 1주일 전 매일 18:00시의 택시 요금을 반환합니다.
 * @summary 카이스트 본원 <-> 대전역의 경우, cron으로 1주일 전 미리 캐싱해놓은 데이터를 기반으로 주어진 시간에 대한 택시 요금을 반환합니다. 만일, 해당 데이터가 존재하지 않을 경우에는 직접 호출해 보여줍니다.
 * @param {Request} req - 파라미터로 start, goal, time을 받습니다.
 *  - @param {String} start - 출발지
 *  - @param {String} goal - 도착지
 *  - @param {Date} time - 출발 시간 (ISO 8601)
 */
const getTaxiFare = async (req, res) => {
  try {
    let start = await locationModel.findOne({
      koName: { $eq: req.query.start },
    });
    let goal = await locationModel
      .findOne({ koName: { $eq: req.query.goal } })
      .clone();
    let time = new Date(req.query.time);
    let sTime = scaledTime(time); // Scaled Time. 0 ~ 47 (0:00 ~ 23:30)

    // 카이스트 본원 <-> 대전역
    if (
      (start.koName === "카이스트 본원" && goal.koName === "대전역") ||
      (start.koName === "대전역" && goal.koName === "카이스트 본원")
    ) {
      let taxiFare = await taxiFareModel
        .findOne(
          {
            start: start.koName,
            goal: goal.koName,
            time: sTime,
          },
          function (err, docs) {
            if (err)
              console.log(
                "Error occured while finding TaxiFare documents: " + err.message
              );
          }
        )
        .clone();
      //만일 cron이 아직 돌지 않은 상태의 시간대의 정보를 필요로하는 비상시의 경우 대비
      if (!taxiFare || taxiFare.fare === 0) {
        let response = await axios.get(
          `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${
            start.longitude + "," + start.latitude
          }&goal=${goal.longitude + "," + goal.latitude}&options=traoptimal`,
          { headers: naverCloudApi }
        );
        res.json({ fare: response.data.route.traoptimal[0].summary.taxiFare });
      } else {
        res.json({ fare: taxiFare.fare });
      }
    }
    // 카이스트 본원 <-> 대전역이 아닌 경우
    else {
      let taxiFare = await taxiFareModel
        .findOne(
          {
            start: start.koName,
            goal: goal.koName,
            time: 0,
          },
          function (err, docs) {
            if (err)
              console.log(
                "Error occured while finding TaxiFare documents: " + err.message
              );
          }
        )
        .clone();
      //만일 cron이 아직 돌지 않은 상태의 시간대의 정보를 필요로하는 비상시의 경우 대비
      if (!taxiFare || taxiFare.fare === 0) {
        let response = await axios.get(
          `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${
            start.longitude + "," + start.latitude
          }&goal=${goal.longitude + "," + goal.latitude}&options=traoptimal`,
          { headers: naverCloudApi }
        );
        res.json({ fare: response.data.route.traoptimal[0].summary.taxiFare });
      } else {
        res.json({ fare: taxiFare.fare });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed with exception: " + err.message });
  }
};

/**
 * 주어진 start, goal, sTime에 대한 단일 택시 요금을 업데이트합니다.
 * @summary 카이스트 본원 <-> 대전역의 경로를 제외한 다른 경로의 경우, cron에 의해 매일 18:00시의 택시 요금을 업데이트 하게 됩니다.
 * @summary 카이스트 본원 <-> 대전역의 경우, 미리 캐싱해놓은 데이터를 기반으로 주어진 시간(30분 간격)에 대한 택시 요금을 반환합니다.
 * @param {String} locStart - 출발지 string
 * @param {String} locGoal - 도착지 string
 * @param {Date} sTime - 출발 시간 (scaledTime에 의해 변경된 시간, 0 ~ 6 (Sunday~Saturday) * 48 + 0 ~ 47 (0:00 ~ 23:30))
 */
const updateTaxiFare = async (locStart, locGoal, sTime) => {
  const start = await locationModel.findOne({ koName: { $eq: locStart } });
  const goal = await locationModel
    .findOne({ koName: { $eq: locGoal } })
    .clone();
  let response = await axios.get(
    `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${
      start.longitude + "," + start.latitude
    }&goal=${goal.longitude + "," + goal.latitude}&options=traoptimal`,
    { headers: naverCloudApi }
  );
  let fare = response.data.route.traoptimal[0].summary.taxiFare;
  await taxiFareModel.updateOne(
    { start: locStart, goal: locGoal, time: sTime },
    { fare: fare },
    function (err, docs) {
      if (err)
        console.log(
          "Error occured while updating TaxiFare document: " + err.message
        );
    }
  );
};

module.exports = { initDatabase, getTaxiFare, updateTaxiFare };
