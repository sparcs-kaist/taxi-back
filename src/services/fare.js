const logger = require("../modules/logger");

const { naverMap } = require("../../loadenv");
const { taxiFareModel, locationModel } = require("../modules/stores/mongo");
const { scaledTime, callTaxiFare } = require("../modules/fare");

const naverMapApi = {
  "X-NCP-APIGW-API-KEY-ID": naverMap.apiId,
  "X-NCP-APIGW-API-KEY": naverMap.apiKey,
};

/**
 * 주어진 from, to, time에 대한 택시 요금을 반환합니다.
 * @summary 카이스트 본원 <-> 대전역의 경로를 제외한 다른 경로의 경우, 1주일 전 매일 18:00시의 택시 요금을 반환합니다.
 * @summary 카이스트 본원 <-> 대전역의 경우, cron으로 1주일 전 미리 캐싱해놓은 데이터를 기반으로 주어진 시간에 대한 택시 요금을 반환합니다. 만일, 해당 데이터가 존재하지 않을 경우에는 직접 호출해 보여줍니다.
 * @param {Request} req - 파라미터로 from, to, time을 받습니다.
 *  - @param {mongoose.Schema.Types.ObjectId} from - 출발지
 *  - @param {mongoose.Schema.Types.ObjectId} to - 도착지
 *  - @param {Date} time - 출발 시간 (ISO 8601)
 */
const getTaxiFareHandler = async (req, res) => {
  try {
    if (
      naverMapApi["X-NCP-APIGW-API-KEY"] === false ||
      naverMapApi["X-NCP-APIGW-API-KEY-ID"] === false
    ) {
      res.status(503).json({
        error: "fare/getTaxiFareHandler: Naver Map API credential not found",
      });
      return;
    }
    const from = await locationModel.findOne({
      _id: { $eq: req.query.from },
    });
    const to = await locationModel.findOne({ _id: { $eq: req.query.to } });
    const sTime = scaledTime(new Date(req.query.time));

    if (!from || !to) {
      res
        .status(400)
        .json({ error: "fare/getTaxiFareHandler: Wrong location" });
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
                "Error occured while finding Taxi Fare documents: " +
                  err.message
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
                "Error occured while finding Taxi Fare documents: " +
                  err.message
              );
          }
        )
        .clone();
      //만일 cron이 아직 돌지 않은 상태의 시간대의 정보를 필요로하는 비상시의 경우 대비
      if (!taxiFare || taxiFare.fare <= 0) {
        await callTaxiFare(from, to)
          .then((fare) => {
            res.status(200).json({ fare: fare });
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
                "Error occured while finding Taxi Fare documents: " +
                  err.message
              );
          }
        )
        .clone();
      //만일 cron이 아직 돌지 않은 상태의 시간대의 정보를 필요로하는 비상시의 경우 대비
      if (!taxiFare || taxiFare.fare <= 0) {
        await callTaxiFare(from, to)
          .then((fare) => {
            res.status(200).json({ fare: fare });
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
      .json({ error: "fare/getTaxiFareHandler: Failed to load Taxi Fare" });
  }
};

module.exports = { getTaxiFareHandler };
