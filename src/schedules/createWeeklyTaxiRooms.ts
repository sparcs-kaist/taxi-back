/* eslint-disable no-underscore-dangle */
import type { Express } from "express";
import type { Types } from "mongoose";
import logger from "@/modules/logger";
import { locationModel, roomModel } from "@/modules/stores/mongo";
import { allocateEmojiIdentifier } from "@/modules/roomIdentifier";

const DAY_MS = 24 * 60 * 60 * 1000;
const LOOKBACK_WEEKS = 4;
const DEFAULT_MAX_PART_LENGTH = 4;
const WEEKLY_ROOM_NAME = "정기 택시팟";
const MAIN_CAMPUS_KO_NAMES = ["카이스트 본원", "택시승강장"];
const DAEJEON_STATION_KO_NAME = "대전역";

type TimeBucket = { hour: number; minute: 0 | 30 };
type BucketStat = TimeBucket & { participantCount: number; roomCount: number };
type CreationPlan = TimeBucket & { count: number };
type TargetRoute = {
  weekday: number;
  from: "main" | "station";
  to: "main" | "station";
};

export const tuesdayTargetRoutes: TargetRoute[] = [
  { weekday: 4, from: "main", to: "station" },
  { weekday: 5, from: "main", to: "station" },
];

export const saturdayTargetRoutes: TargetRoute[] = [
  { weekday: 0, from: "station", to: "main" },
];

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS);

export const getTargetDate = (baseDate: Date, weekday: number) => {
  const target = startOfDay(baseDate);
  const daysUntilTarget = (weekday - target.getDay() + 7) % 7;
  return addDays(target, daysUntilTarget);
};

export const getLookbackRanges = (targetDate: Date) =>
  Array.from({ length: LOOKBACK_WEEKS }, (_, i) => {
    const start = addDays(startOfDay(targetDate), -7 * (i + 1));
    return { start, end: addDays(start, 1) };
  });

export const getTimeBucket = (date: Date): TimeBucket => ({
  hour: date.getHours(),
  minute: date.getMinutes() < 30 ? 0 : 30,
});

const bucketKey = ({ hour, minute }: TimeBucket) => `${hour}:${minute}`;

const compareBucket = (a: TimeBucket, b: TimeBucket) =>
  a.hour - b.hour || a.minute - b.minute;

export const buildCreationPlans = (stats: BucketStat[]): CreationPlan[] => {
  if (stats.length === 0) return [];

  const ordered = [...stats].sort(
    (a, b) => b.participantCount - a.participantCount || compareBucket(a, b)
  );
  const topCount = ordered[0].participantCount;
  const topBuckets = ordered.filter(
    (stat) => stat.participantCount === topCount
  );

  if (topBuckets.length > 1) {
    return topBuckets.sort(compareBucket).map((bucket) => ({
      hour: bucket.hour,
      minute: bucket.minute,
      count: 2,
    }));
  }

  const plans: CreationPlan[] = [
    { hour: ordered[0].hour, minute: ordered[0].minute, count: 2 },
  ];
  const second = ordered.find((stat) => stat.participantCount < topCount);
  if (second) {
    plans.push({ hour: second.hour, minute: second.minute, count: 1 });
  }
  return plans;
};

const buildDepartureTime = (targetDate: Date, bucket: TimeBucket) => {
  const departureTime = startOfDay(targetDate);
  departureTime.setHours(bucket.hour, bucket.minute, 0, 0);
  return departureTime;
};

const countRealParticipants = (part: { user: Types.ObjectId }[]) =>
  part.length;

const getLocations = async () => {
  const [main, station] = await Promise.all([
    locationModel.findOne({ koName: { $in: MAIN_CAMPUS_KO_NAMES } }),
    locationModel.findOne({ koName: DAEJEON_STATION_KO_NAME }),
  ]);

  if (!main || !station) {
    logger.warn("WeeklyTaxiRooms : required locations not found");
    return null;
  }
  return { main, station };
};

const getBucketStats = async (
  from: Types.ObjectId,
  to: Types.ObjectId,
  targetDate: Date
): Promise<BucketStat[]> => {
  const ranges = getLookbackRanges(targetDate);
  const rooms = await roomModel
    .find(
      {
        from,
        to,
        $or: ranges.map(({ start, end }) => ({
          time: { $gte: start, $lt: end },
        })),
      },
      "time part.user"
    )
    .lean();

  const stats = rooms.reduce((acc, room) => {
    const participantCount = countRealParticipants(room.part);
    if (participantCount === 0) return acc;

    const bucket = getTimeBucket(new Date(room.time));
    const key = bucketKey(bucket);
    const prev = acc.get(key) ?? {
      ...bucket,
      participantCount: 0,
      roomCount: 0,
    };
    prev.participantCount += participantCount;
    prev.roomCount += 1;
    acc.set(key, prev);
    return acc;
  }, new Map<string, BucketStat>());

  return [...stats.values()];
};

const createRooms = async (
  from: Types.ObjectId,
  to: Types.ObjectId,
  departureTime: Date,
  desiredCount: number
) => {
  const existingCount = await roomModel.countDocuments({
    isWeeklyRoom: true,
    from,
    to,
    time: departureTime,
  });

  await Promise.all(
    Array.from(
      { length: Math.max(0, desiredCount - existingCount) },
      async () => {
        const emojiIdentifier = await allocateEmojiIdentifier(departureTime);
        await roomModel.create({
          name: WEEKLY_ROOM_NAME,
          from,
          to,
          time: departureTime,
          part: [],
          madeat: new Date(),
          maxPartLength: DEFAULT_MAX_PART_LENGTH,
          settlementTotal: 0,
          emojiIdentifier,
          isWeeklyRoom: true,
        });
      }
    )
  );
};

export const createWeeklyTaxiRooms = async (
  now = new Date(),
  routes: TargetRoute[] = [...tuesdayTargetRoutes, ...saturdayTargetRoutes]
) => {
  const locations = await getLocations();
  if (!locations) return;

  await Promise.all(
    routes.map(async (route) => {
      const targetDate = getTargetDate(now, route.weekday);
      const from = locations[route.from]._id;
      const to = locations[route.to]._id;
      const stats = await getBucketStats(from, to, targetDate);
      const plans = buildCreationPlans(stats);

      await Promise.all(
        plans.map((plan) =>
          createRooms(from, to, buildDepartureTime(targetDate, plan), plan.count)
        )
      );
    })
  );
};

const scheduleCreateWeeklyTaxiRooms =
  (app: Express, routes: TargetRoute[]) => async () => {
    app.get("io");
    try {
      await createWeeklyTaxiRooms(new Date(), routes);
    } catch (err) {
      logger.error(err);
    }
  };

export default scheduleCreateWeeklyTaxiRooms;
