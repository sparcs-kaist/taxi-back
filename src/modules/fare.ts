import axios from "axios";
import logger from "./logger";

import { naverMap } from "@/loadenv";
import { taxiFareModel, locationModel } from "./stores/mongo";
import type { UpdateOneModel } from "mongodb";
import type { TaxiFare, Location } from "@/types/mongo";

const naverMapApi = {
  "X-NCP-APIGW-API-KEY-ID": naverMap.apiId,
  "X-NCP-APIGW-API-KEY": naverMap.apiKey,
};

// 30분 간격으로 하루를 48개의 시간대로 나누어 택시 요금을 계산합니다.
const timeConstants = 48;

/**
 *  출발 시간 (24h를 30분 단위로 분리 & 요일 정보도 하나로 관리, 0 ~ 6 (Sunday~Saturday) * 48 + 0 ~ 47 (0:00 ~ 23:30))
 * @param {Date} time: 시간
 * @returns {number} scaledTime
 */
export const scaledTime = (time: Date) => {
  return (
    timeConstants * time.getDay() +
    time.getHours() * 2 +
    (time.getMinutes() >= 30 ? 1 : 0)
  );
};

/**
 * 데이터베이스를 초기화합니다. 존재하지 않는 필드가 있을때, 기존의 값으로 초기화해 놓거나, 아얘 비어있을 경우에 api를 통해 값을 받아와 초기화합니다.
 * @returns
 */
export const initializeDatabase = async () => {
  try {
    if (
      !naverMapApi["X-NCP-APIGW-API-KEY"] ||
      !naverMapApi["X-NCP-APIGW-API-KEY-ID"]
    ) {
      logger.error(
        "There is no credential for Naver Map. Taxi Fare functions are disabled."
      );
      return;
    }
    const location: Location[] = await locationModel
      .find({ isValid: { $eq: true } })
      .lean();

    await Promise.all(
      location.map(async (from) => {
        return Promise.all(
          location.map(async (to) => {
            if (from._id === to._id) return;
            let tableFare: UpdateOneModel<TaxiFare>[] = [];
            const prevTaxiFare = (
              await taxiFareModel
                .findOne(
                  {
                    from: from._id,
                    to: to._id,
                  },
                  { fare: true }
                )
                .lean()
            )?.fare;
            const fare = prevTaxiFare
              ? prevTaxiFare
              : await callTaxiFare(from, to);
            if (
              (from.koName === "카이스트 본원" && to.koName === "대전역") ||
              (from.koName === "대전역" && to.koName === "카이스트 본원")
            ) {
              [...Array(timeConstants * 7)].map((_, i) => {
                tableFare.push({
                  update: {
                    filter: {
                      from: from._id,
                      to: to._id,
                      time: i,
                      isMajor: true,
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
            } else {
              [...Array(7)].map((_, i) => {
                tableFare.push({
                  update: {
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
          })
        );
      })
    );
  } catch (err) {
    logger.error("Error occured while initializing database: " + err.message);
  }
};

/**
 * 주어진 from, to, sTime에 대한 단일 택시 요금을 업데이트합니다.
 * @summary 카이스트 본원 <-> 대전역의 경로를 제외한 다른 경로의 경우, cron에 의해 매일 18:00시의 택시 요금을 업데이트 하게 됩니다.
 * @summary 카이스트 본원 <-> 대전역의 경우, 미리 캐싱해놓은 데이터를 기반으로 주어진 시간(30분 간격)에 대한 택시 요금을 반환합니다.
 * @param {number} sTime - 출발 시간 (scaledTime에 의해 변경된 시간, 0 ~ 6 (Sunday~Saturday) * 48 + 0 ~ 47 (0:00 ~ 23:30))
 * @param {Boolean} isMajor - 카이스트 본원 <-> 대전역 경로 / 이외 경로
 */
export const updateTaxiFare = async (sTime: number, isMajor: Boolean) => {
  if (
    !naverMapApi["X-NCP-APIGW-API-KEY"] ||
    !naverMapApi["X-NCP-APIGW-API-KEY-ID"]
  ) {
    logger.error(
      "There is no credential for Naver Map. Taxi Fare functions are disabled."
    );
    return;
  }
  const prevFares = await taxiFareModel
    .find({
      time: sTime,
      isMajor: isMajor,
    })
    .lean();
  await prevFares.reduce(async (acc, item) => {
    const from = await locationModel.findOne({ _id: item.from });
    const to = await locationModel.findOne({ _id: item.to });

    await acc;
    await callTaxiFare(from, to)
      .then(async (fare) => {
        if (fare) {
          await taxiFareModel.updateOne(
            { from: item.from, to: item.to, time: sTime },
            { fare: fare }
          );
        }
      })
      .catch((err) => {
        logger.error(err.message);
      });
    await new Promise((resolve) => setTimeout(() => resolve, 200));
    return acc;
  }, Promise.resolve()); // 초기값 설정 안 하면, 처음에 acc가 undefined로 들어가서 첫 인덱스를 to에서 못 쓰게 됨
};

/**
 * @param {Location} from : 출발지 (longitude, latitude)
 * @param {Location} to : 도착지 (longitude, latitude)
 * @returns naver map api call을 통해 받아온 예상 택시 요금
 */
export const callTaxiFare = async (from: Location, to: Location) => {
  if (
    !naverMapApi["X-NCP-APIGW-API-KEY"] ||
    !naverMapApi["X-NCP-APIGW-API-KEY-ID"]
  ) {
    logger.error(
      "There is no credential for Naver Map. Taxi Fare functions are disabled."
    );
    return;
  }
  return (
    await axios.get(
      `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${from.longitude},${from.latitude}}&goal=${to.longitude},${to.latitude}&options=traoptimal`,
      { headers: naverMapApi }
    )
  ).data.route.traoptimal[0].summary.taxiFare;
};