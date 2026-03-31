import { Types } from "mongoose";
import { locationModel, taxiFareModel } from "@/modules/stores/mongo";
import type { Location, TaxiFare } from "@/types/mongo.d";

type Coordinate = {
  lat: number;
  lng: number;
};

export const mapDateToTime = (date = new Date()) => {
  // 가장 가까운 0, 10, 20분을 찾아서 int로 환산
  const day = date.getDay();
  const hour = date.getHours();
  const minute = date.getMinutes();
  return (day * 144 + hour * 6 + Math.floor((minute + 5) / 10)) % 1008;
};

/**
 * 두 좌표 (latitude, longitude) 가 주어졌을 때 두 좌표 사이의 거리를 계산하는 함수입니다.
 * 지구는 둥그니까...!
 */
const haversineDistance = (from: Coordinate, to: Coordinate) => {
  const toRadian = Math.PI / 180;
  return (
    2 *
    6371 *
    Math.asin(
      Math.sqrt(
        Math.sin(((to.lat - from.lat) / 2) * toRadian) ** 2 +
          Math.cos(from.lat * toRadian) *
            Math.cos(to.lat * toRadian) *
            Math.sin(((to.lng - from.lng) / 2) * toRadian) ** 2
      )
    )
  );
};

const ordinaryLeastSquares = (
  record: {
    dist: number;
    fare: number;
  }[]
) => {
  // OLS 구현
  let sumDist = 0;
  let sumFare = 0;
  let sumSquareDist = 0;
  let sumDistFare = 0;
  const LEN = record.length;

  if (LEN === 0) {
    return { weight: 0, bias: 0 };
  }
  for (let i = 0; i < LEN; i++) {
    sumDist += record[i].dist;
    sumFare += record[i].fare;
    sumSquareDist += record[i].dist ** 2;
    sumDistFare += record[i].dist * record[i].fare;
  }

  const weightDenominator = LEN * sumSquareDist - sumDist ** 2;

  let weight = 0;
  if (weightDenominator === 0) {
    weight = 0;
  } else {
    weight = (LEN * sumDistFare - sumDist * sumFare) / weightDenominator;
  }
  const bias = (sumFare - weight * sumDist) / LEN;
  return { weight, bias };
};

/**
 * 택시비를 예측해줍니다.
 * 1단계로 동일 루트, 동일 시간대의 예상 택시비를 찾아서 평균
 * 2단계로 동일 루트, 다른 시간대의 예상 택시비를 찾아서 평균
 * 3단계로 다른 루트, 동일 시간대의 예상 택시비를 찾아서 (거리당 평균) * 거리
 * 4단계로 모든 루트들의 예상 택시비를 찾아서 (거리당 평균) * 거리
 */
export const forecastTaxiFare = async (
  from: Types.ObjectId,
  to: Types.ObjectId,
  time: Date
) => {
  const locationMap: Map<string, Location> = new Map();

  const locationList = await locationModel.find();
  locationList.forEach((location: Location) => {
    locationMap.set(location._id.toString(), location);
  });

  const fromLocation = locationMap.get(from.toString());
  const toLocation = locationMap.get(to.toString());

  if (!fromLocation || !toLocation || from.toString() === to.toString()) {
    return 0;
  }

  // 1단계
  let record = await taxiFareModel
    .find({
      from: fromLocation._id,
      to: toLocation._id,
      time: mapDateToTime(time),
    })
    .lean();

  if (record.length < 3) {
    // 2단계: 데이터의 개수가 충분하지 않은 경우
    record = await taxiFareModel
      .find({
        from: fromLocation._id,
        to: toLocation._id,
      })
      .lean();
  }

  if (record.length >= 2) {
    const avg = record.reduce(
      (acc: number, cur: TaxiFare) => acc + cur.fare,
      0
    );
    return avg / record.length;
  }
  // 3단계
  // 기본요금이 존재하므로, y = ax + b로 추정.
  // 최소제곱법을 사용
  record = await taxiFareModel
    .find({
      time: mapDateToTime(time),
    })
    .lean();

  if (record.length <= 20) {
    // 4단계: 데이터의 개수가 충분하지 않은 경우
    record = await taxiFareModel.find().lean();
  }

  const changedRecord = record.map((rec: TaxiFare) => {
    const from = locationMap.get(rec.from.toString());
    const to = locationMap.get(rec.to.toString());
    if (!from || !to) {
      // db의 변경으로 인한 누락 등의 경우 0으로 처리한 뒤, 이후 filter에서 거를 예정.
      return 0;
    } else {
      return {
        dist: haversineDistance(
          { lat: from.latitude, lng: from.longitude },
          { lat: to.latitude, lng: to.longitude }
        ),
        fare: rec.fare,
      };
    }
  });

  const parameter = ordinaryLeastSquares(
    changedRecord.filter((record) => record != 0)
  );
  return (
    parameter.weight *
      haversineDistance(
        { lat: fromLocation.latitude, lng: fromLocation.longitude },
        { lat: toLocation.latitude, lng: toLocation.longitude }
      ) +
    parameter.bias
  );
};
