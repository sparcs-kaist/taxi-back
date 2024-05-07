const axios = require("axios");

const { naverMapApiId, naverMapApiKey } = require("../../loadenv");
const { taxiFareModel, locationModel } = require("../modules/stores/mongo");
const { scaledTime } = require("../modules/fare");
const logger = require("../modules/logger");

// Naver Cloud Platform Maps Directions 5 API Keys
const naverMapApi = {
  "X-NCP-APIGW-API-KEY-ID": naverMapApiId,
  "X-NCP-APIGW-API-KEY": naverMapApiKey,
};
const naverMapApiCall =
  "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=";

/**
 * 주어진 from, to, time에 대한 택시 요금을 반환합니다.
 * @summary 카이스트 본원 <-> 대전역의 경로를 제외한 다른 경로의 경우, 1주일 전 매일 18:00시의 택시 요금을 반환합니다.
 * @summary 카이스트 본원 <-> 대전역의 경우, cron으로 1주일 전 미리 캐싱해놓은 데이터를 기반으로 주어진 시간에 대한 택시 요금을 반환합니다. 만일, 해당 데이터가 존재하지 않을 경우에는 직접 호출해 보여줍니다.
 * @param {Request} req - 파라미터로 from, to, time을 받습니다.
 *  - @param {mongoose.Schema.Types.ObjectId} from - 출발지
 *  - @param {mongoose.Schema.Types.ObjectId} to - 도착지
 *  - @param {Date} time - 출발 시간 (ISO 8601)
 */
const getTaxiFare = async (req, res) => {
  try {
    if (
      !naverMapApi["X-NCP-APIGW-API-KEY"] ||
      !naverMapApi["X-NCP-APIGW-API-KEY-ID"]
    ) {
      logger.log(
        "There is no credential for Naver Map. Taxi Fare functions are disabled."
      );
      res
        .status(503)
        .json({ error: "fare/getTaxiFare: Naver Cloud API not found" });
      return;
    }
    const from = await locationModel
      .findOne({
        _id: { $eq: req.query.from },
      })
      .clone();
    const to = await locationModel
      .findOne({ _id: { $eq: req.query.to } })
      .clone();
    const sTime = scaledTime(new Date(req.query.time));

    if (!from || !to) {
      res.status(400).json({ error: "fare/getTaxiFare: Wrong location" });
      return;
    }
    const isMajor = (
      await taxiFareModel
        .findOne(
          { from: from._id, to: to._id, time: 0 },
          { isMajor: true },
          (err, docs) => {
            if (err)
              logger.error(
                "Error occured while finding TaxiFare documents: " + err.message
              );
          }
        )
        .clone()
    ).isMajor;
    // 시간대별 정보 관리 (현재: 카이스트 본원 <-> 대전역)
    if (isMajor) {
      const taxiFare = await taxiFareModel
        .findOne(
          {
            from: from._id,
            to: to._id,
            time: sTime,
          },
          (err, docs) => {
            if (err)
              logger.error(
                "Error occured while finding TaxiFare documents: " + err.message
              );
          }
        )
        .clone();
      //만일 cron이 아직 돌지 않은 상태의 시간대의 정보를 필요로하는 비상시의 경우 대비
      if (!taxiFare || taxiFare.fare === 0) {
        await axios
          .get(
            `${naverMapApiCall + from.longitude + "," + from.latitude}&goal=${
              to.longitude + "," + to.latitude
            }&options=traoptimal`,
            { headers: naverMapApi }
          )
          .then((text) => {
            res
              .status(200)
              .json({ fare: text.data.route.traoptimal[0].summary.taxiFare });
          })
          .catch((err) => {
            logger.error(err.message);
          });
      } else {
        res.status(200).json({ fare: taxiFare.fare });
      }
    } else {
      const taxiFare = await taxiFareModel
        .findOne(
          {
            from: from._id,
            to: to._id,
            time: 0,
          },
          (err, docs) => {
            if (err)
              logger.error(
                "Error occured while finding TaxiFare documents: " + err.message
              );
          }
        )
        .clone();
      //만일 cron이 아직 돌지 않은 상태의 시간대의 정보를 필요로하는 비상시의 경우 대비
      if (!taxiFare || taxiFare.fare === 0) {
        await axios
          .get(
            `${naverMapApiCall + from.longitude + "," + from.latitude}&goal=${
              to.longitude + "," + to.latitude
            }&options=traoptimal`,
            { headers: naverMapApi }
          )
          .then((text) => {
            res
              .status(200)
              .json({ fare: text.data.route.traoptimal[0].summary.taxiFare });
          })
          .catch((err) => {
            logger.error(err.message);
          });
      } else {
        res.status(200).json({ fare: taxiFare.fare });
      }
    }
  } catch (err) {
    logger.error(err.message);
    res
      .status(500)
      .json({ error: "fare/getTaxiFare: Failed to load taxi fare" });
  }
};

/**
 * 주어진 from, to, sTime에 대한 단일 택시 요금을 업데이트합니다.
 * @summary 카이스트 본원 <-> 대전역의 경로를 제외한 다른 경로의 경우, cron에 의해 매일 18:00시의 택시 요금을 업데이트 하게 됩니다.
 * @summary 카이스트 본원 <-> 대전역의 경우, 미리 캐싱해놓은 데이터를 기반으로 주어진 시간(30분 간격)에 대한 택시 요금을 반환합니다.
 * @param {Date} sTime - 출발 시간 (scaledTime에 의해 변경된 시간, 0 ~ 6 (Sunday~Saturday) * 48 + 0 ~ 47 (0:00 ~ 23:30))
 * @param {Boolean} isMajor - 카이스트 본원 <-> 대전역 여부
 */
const updateTaxiFare = async (sTime, isMajor) => {
  const prevFares = await taxiFareModel
    .find({
      time: sTime,
      isMajor: isMajor,
    })
    .clone();
  await prevFares.reduce(async (acc, item) => {
    const from = await locationModel.findOne({ _id: item.from }).clone();
    const to = await locationModel.findOne({ _id: item.to }).clone();

    await acc;
    await axios
      .get(
        `${naverMapApiCall + from.longitude + "," + from.latitude}&goal=${
          to.longitude + "," + to.latitude
        }&options=traoptimal`,
        { headers: naverMapApi }
      )
      .catch((err) => {
        logger.error(err.message);
      })
      .then(async (res) => {
        await taxiFareModel
          .updateOne(
            { from: item.from, to: item.to, time: sTime },
            { fare: res.data.route.traoptimal[0].summary.taxiFare },
            (err, docs) => {
              if (err)
                logger.error(
                  "Error occured while updating TaxiFare document: " +
                    err.message
                );
            }
          )
          .clone();
      })
      .catch((err) => {
        logger.error(err.message);
      });
    await new Promise((resolve) => setTimeout(() => resolve, 200));
    return acc;
  }, Promise.resolve());
};

module.exports = {
  getTaxiFare,
  updateTaxiFare,
};
