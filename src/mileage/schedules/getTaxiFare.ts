import { locationModel, taxiFareModel } from "@/modules/stores/mongo";
import type { Location } from "@/types/mongo";
import { mapDateToTime } from "../modules/forecastTaxiFare";
import { naverMap } from "@/loadenv";

// 필요한 최소 타입
type NaverMapType = {
  code: number;
  route: {
    traoptimal: Array<{ summary: { taxiFare: number } }>;
  };
};

/**
 * array.filter()와는 달리 truthy만 return하는 것이 아닌 falsy도 따로 return합니다.
 * @returns [truthy, falsy]
 */
const partition = <T>(array: T[], func: (item: T) => boolean): [T[], T[]] => {
  const truthy: T[] = [];
  const falsy: T[] = [];

  for (const item of array) {
    (func(item) ? truthy : falsy).push(item);
  }

  return [truthy, falsy];
};

const orderedPair = (locs: Location[]) => {
  return locs.flatMap((fromLocation) =>
    locs
      .filter(
        (toLocation) => String(toLocation._id) !== String(fromLocation._id)
      )
      .map((toLocation) => [fromLocation, toLocation] as const)
  );
};

const getTaxiFare = async (fromLocation: Location, toLocation: Location) => {
  if (naverMap.apiId === undefined || naverMap.apiKey === undefined) {
    return;
  }
  const url = new URL("https://maps.apigw.ntruss.com/map-direction/v1/driving");
  url.searchParams.set(
    "start",
    `${fromLocation.longitude},${fromLocation.latitude}`
  );
  url.searchParams.set(
    "goal",
    `${toLocation.longitude},${toLocation.latitude}`
  );

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-ncp-apigw-api-key-id": naverMap.apiId,
        "x-ncp-apigw-api-key": naverMap.apiKey,
      },
    });

    const json = (await res.json()) as unknown as NaverMapType;
    if (json.code === 0) {
      const fare = json.route.traoptimal[0].summary.taxiFare;
      let taxiFare = new taxiFareModel({
        from: fromLocation._id,
        to: toLocation._id,
        time: mapDateToTime(),
        fare: fare,
      });
      await taxiFare.save();
    }
    return 1000;
  } catch (err) {
    return 1000;
  }
};

export const getFareRoutine = async () => {
  const locationList: Location[] = await locationModel.find();
  const [necessaryList, nonNecessaryList] = partition(
    locationList,
    (location) => {
      return ["대전역", "서대전역", "카이스트 본원"].includes(location.koName);
    }
  );
  nonNecessaryList.sort(() => Math.random() - 0.5);
  const randomLocList = nonNecessaryList.slice(0, 3);
  const targetList = necessaryList.concat(randomLocList);
  const pairs = orderedPair(targetList);

  const CONCURRENCY = 10;
  for (let i = 0; i < pairs.length; i += CONCURRENCY) {
    const miniPair = pairs.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      miniPair.map((val) => getTaxiFare(val[0], val[1]))
    );
  }
};

// 월간 50 000 건 무료
// 매 30분마다 실행시 하루 48번 실행
// 하루 48번 실행시 31일 기준 1488번 실행
// 한번 실행당 최대 33번의 api 호출 가능
// 6P2 = 30 -> 6개의 location에 대한 prediction을 저장 가능.
