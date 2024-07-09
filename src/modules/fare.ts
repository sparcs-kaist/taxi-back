import axios, { AxiosRequestHeaders } from "axios";
import logger from "../modules/logger";

import { naverMap } from "../../loadenv";
import { taxiFareModel, locationModel } from "./stores/mongo";

interface TaxiFareInfo {
  from: string;
  to: string;
  time: number;
  fare: number;
  isMajor: boolean;
}

const naverMapApi: AxiosRequestHeaders = {
  "X-NCP-APIGW-API-KEY-ID": naverMap.naverMapApiId,
  "X-NCP-APIGW-API-KEY": naverMap.naverMapApiKey,
};
const naverMapApiCall =
  "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=";

const timeConstants = 48;

const scaledTime = (time: Date): number => {
  return (
    timeConstants * time.getDay() +
    time.getHours() * 2 +
    (time.getMinutes() >= 30 ? 1 : 0)
  );
};

const initDatabase = async (): Promise<void> => {
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
    await taxiFareModel.deleteMany({});
    const location = await locationModel.find({ isValid: { $eq: true } });
    location.map(async (from) => {
      location.reduce(async (acc, to) => {
        await acc;
        if (from._id === to._id) return;
        let tableFare: TaxiFareInfo[] = [];
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
        } else {
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

export { scaledTime, initDatabase };
