const axios = require("axios");

const { naverCloudApiId, naverCloudApiKey } = require("../../loadenv");
const { taxiFareModel } = require("../modules/stores/mongo");
const locations = require("../locations.json"); //TODO: Change Location style of taxi-fare to match taxi-back

// Naver Cloud Platform Maps Directions 5 API Keys
const naverCloudApi = {
  "X-NCP-APIGW-API-KEY-ID": naverCloudApiId,
  "X-NCP-APIGW-API-KEY": naverCloudApiKey,
};

// Initialize database
// Erase all previous data and sets all taxi fare to 0
const initDatabase = async (req, res) => {
  try {
    // Remove all previous data
    await taxiFareModel.deleteMany({});

    //TODO: Change Location style of taxi-fare to match taxi-back
    for (let skey in locations) {
      //TODO: Change Location style of taxi-fare to match taxi-back
      for (let gkey in locations) {
        if (skey === gkey) continue;
        let tableFare = [];
        if (
          (skey === "카이스트 본원" && gkey === "대전역") ||
          (skey === "대전역" && gkey === "카이스트 본원")
        ) {
          for (let i = 0; i < 48; i++) {
            tableFare.push({
              start: skey,
              goal: gkey,
              time: i,
              fare: 0,
            });
          }
        } else {
          tableFare.push({
            start: skey,
            goal: gkey,
            time: 0,
            fare: 0,
          });
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
 * @param {Request} req - 파라미터로 start, goal, time을 받습니다.
 *  - @param {String} start - 출발지
 *  - @param {String} goal - 도착지
 *  - @param {Date} time - 출발 시간 (ISO 8601)
 */
const getTaxiFare = async (req, res) => {
  try {
    let start = locations[req.params.start]; //TODO: Change Location style of taxi-fare to match taxi-back
    let goal = locations[req.params.goal]; //TODO: Change Location style of taxi-fare to match taxi-back
    let time = new Date(req.params.time);
    let sTime = time.getHours() * 2 + Math.floor(time.getMinutes() / 30); // Scaled Time. 0 ~ 47 (0:00 ~ 23:30)

    console.log(taxiFareModel);
    let taxiFare = await taxiFareModel
      .findOne(
        {
          start: req.params.start,
          goal: req.params.goal,
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

    if (
      taxiFare &&
      new Date() - taxiFare.updatedAt < 24 * 60 * 60 * 1000 &&
      taxiFare.fare !== 0
    ) {
      res.json({ fare: taxiFare.fare });
    } else {
      let response = await axios.get(
        `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&options=traoptimal`,
        { headers: naverCloudApi }
      );

      let fare = response.data.route.traoptimal[0].summary.taxiFare;
      if (!taxiFare) {
        taxiFare = new taxiFareModel(
          {
            start: req.params.start,
            goal: req.params.goal,
            time: sTime,
            fare: fare,
          },
          function (err, docs) {
            if (err)
              console.log(
                "Error occured while creating a new document of TaxiFare: " +
                  err.message
              );
          }
        ); // 만일 document가 중간에 삭제되어 공백이 생겼을 경우 채우는 용도
      } else {
        await taxiFareModel
          .updateOne(
            { start: req.params.start, goal: req.params.goal, time: sTime },
            { fare: fare },
            function (err, docs) {
              if (err)
                console.log(
                  "Error occured while updating TaxiFare document: " +
                    err.message
                );
            }
          )
          .clone();
      }
      res.json({ fare: fare });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed with exception: " + err.message });
  }
};

module.exports = { initDatabase, getTaxiFare };
