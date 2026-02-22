import type { RequestHandler } from "express";
import { Types, type FilterQuery, type PipelineStage } from "mongoose";
import logger from "@/modules/logger";
import { redisClient } from "@/modules/stores/redis";
import {
  dailySavingsModel,
  locationModel,
  roomModel,
  userModel,
  monthlyRoomCreationModel,
  monthlyUserCreationModel,
  type Room,
} from "@/modules/stores/mongo";
import { getRoomSavings } from "@/modules/savings";
import type {
  HourlyRoomCreationQuery,
  MonthlyRoomCreationQuery,
  MonthlyUserCreationQuery,
  SavingsPeriodQuery,
  SavingsQuery,
  UserDoneRoomCountQuery,
  UserSavingsQuery,
} from "@/routes/docs/schemas/statisticsSchema";

type PopulatedRoom = Room & {
  from?: {
    _id?: Types.ObjectId;
    enName?: string;
    koName?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  to?: {
    _id?: Types.ObjectId;
    enName?: string;
    koName?: string;
    latitude?: number;
    longitude?: number;
  } | null;
};

export const startOfDayUTC = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const SEOUL_TIMEZONE = "Asia/Seoul";
const DAY_MS = 86_400_000;
const START_OF_TRACKING = startOfDayUTC(new Date("2022-01-01T00:00:00Z"));
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const START_OF_MONTH_TRACKING = new Date(Date.UTC(2022, 10, 1, 0, 0, 0, 0)); // 2022-11-01
const STATISTICS_CACHE_PREFIX = "statistics:v1";
const STATISTICS_CACHE_MAX_BYTES = 512 * 1024;
const statisticsCacheInFlight = new Map<string, Promise<unknown>>();
const CACHE_TTL_SECONDS = {
  savings: 120,
  savingsPeriod: 300,
  savingsTotal: 60,
  userSavings: 120,
  userDoneRoomCount: 120,
  monthlyRoomCreation: 3600,
  monthlyUserCreation: 3600,
  hourlyRoomCreation: 600,
} as const;

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS);

const buildStatisticsCacheKey = (
  scope: string,
  params?: Record<string, unknown>
) => {
  if (!params) return `${STATISTICS_CACHE_PREFIX}:${scope}`;

  const queryString = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map((item) => `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`)
          .join("&");
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .filter((entry) => entry.length > 0)
    .join("&");

  if (!queryString) return `${STATISTICS_CACHE_PREFIX}:${scope}`;
  return `${STATISTICS_CACHE_PREFIX}:${scope}?${queryString}`;
};

const getStatisticsCache = async <T>(key: string): Promise<T | null> => {
  if (!redisClient) return null;
  try {
    const cached = await redisClient.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch (err) {
    logger.warn(`Statistics/cache : failed to read cache key ${key}`, err);
    return null;
  }
};

const setStatisticsCache = async (
  key: string,
  value: unknown,
  ttlSeconds: number
) => {
  if (!redisClient) return;
  try {
    const serialized = JSON.stringify(value);
    if (Buffer.byteLength(serialized, "utf8") > STATISTICS_CACHE_MAX_BYTES) {
      return;
    }
    await redisClient.set(key, serialized, { EX: ttlSeconds });
  } catch (err) {
    logger.warn(`Statistics/cache : failed to write cache key ${key}`, err);
  }
};

const getCachedOrCompute = async <T>(
  key: string,
  ttlSeconds: number,
  producer: () => Promise<T>
): Promise<T> => {
  const cached = await getStatisticsCache<T>(key);
  if (cached !== null) return cached;

  const inFlight = statisticsCacheInFlight.get(key);
  if (inFlight) return (await inFlight) as T;

  const compute = (async () => {
    const value = await producer();
    await setStatisticsCache(key, value, ttlSeconds);
    return value;
  })().finally(() => {
    statisticsCacheInFlight.delete(key);
  });

  statisticsCacheInFlight.set(key, compute);
  return (await compute) as T;
};

const startOfDayKST = (date: Date) => {
  const ms = date.getTime() + KST_OFFSET_MS;
  const truncated = Math.floor(ms / DAY_MS) * DAY_MS;
  return new Date(truncated - KST_OFFSET_MS);
};

const startOfMonthKST = (date: Date) => {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const utcMonthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return startOfDayKST(utcMonthStart);
};

const addMonths = (date: Date, months: number) => {
  // Shift to KST before adjusting the month so KST month boundaries stored in UTC advance correctly.
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  const year = kstDate.getUTCFullYear();
  const month = kstDate.getUTCMonth();
  return startOfMonthKST(
    new Date(Date.UTC(year, month + months, 1, 0, 0, 0, 0))
  );
};

const ensureMonthlyRoomsThrough = async (targetMonth: Date) => {
  if (targetMonth < START_OF_MONTH_TRACKING) return;

  const latest = await monthlyRoomCreationModel
    .findOne({ month: { $lte: targetMonth } })
    .sort({ month: -1 })
    .lean();

  let cursorMonth = latest
    ? addMonths(new Date(latest.month), 1)
    : START_OF_MONTH_TRACKING;

  if (cursorMonth > targetMonth) return;

  const cumulativeBase = latest?.cumulativeRooms ?? 0;
  const ops = [];
  let runningTotal = cumulativeBase;

  for (
    let month = cursorMonth.getTime();
    month <= targetMonth.getTime();
    month = addMonths(new Date(month), 1).getTime()
  ) {
    const monthStart = new Date(month);
    const nextMonth = addMonths(monthStart, 1);
    const count = await roomModel.countDocuments({
      madeat: { $gte: monthStart, $lt: nextMonth },
    });
    runningTotal += count;
    ops.push({
      updateOne: {
        filter: { month: monthStart },
        update: { month: monthStart, cumulativeRooms: runningTotal },
        upsert: true,
      },
    });
  }

  if (ops.length > 0) {
    await monthlyRoomCreationModel.bulkWrite(ops);
  }
};

const ensureMonthlyUsersThrough = async (targetMonth: Date) => {
  if (targetMonth < START_OF_MONTH_TRACKING) return;

  const latest = await monthlyUserCreationModel
    .findOne({ month: { $lte: targetMonth } })
    .sort({ month: -1 })
    .lean();

  let cursorMonth = latest
    ? addMonths(new Date(latest.month), 1)
    : START_OF_MONTH_TRACKING;

  if (cursorMonth > targetMonth) return;

  const cumulativeBase = latest?.cumulativeUsers ?? 0;
  const ops = [];
  let runningTotal = cumulativeBase;

  for (
    let month = cursorMonth.getTime();
    month <= targetMonth.getTime();
    month = addMonths(new Date(month), 1).getTime()
  ) {
    const monthStart = new Date(month);
    const nextMonth = addMonths(monthStart, 1);
    const count = await userModel.countDocuments({
      joinat: { $gte: monthStart, $lt: nextMonth },
    });
    runningTotal += count;
    ops.push({
      updateOne: {
        filter: { month: monthStart },
        update: { month: monthStart, cumulativeUsers: runningTotal },
        upsert: true,
      },
    });
  }

  if (ops.length > 0) {
    await monthlyUserCreationModel.bulkWrite(ops);
  }
};

export const getCumulativeAt = async (
  targetDay: Date,
  startHint?: Date
): Promise<number> => {
  const todayStart = startOfDayUTC(new Date());
  const day =
    targetDay >= todayStart ? addDays(todayStart, -1) : startOfDayUTC(targetDay);
  await ensureCumulativeSavingsThrough(day, startHint);
  const doc = await dailySavingsModel
    .findOne({ date: { $lte: day } })
    .sort({ date: -1 })
    .lean();
  return doc?.cumulativeSavings ?? 0;
};

export const ensureCumulativeSavingsThrough = async (
  targetDay: Date,
  startHint?: Date
) => {
  const todayStart = startOfDayUTC(new Date());
  // Never write today's row; cap at yesterday.
  const cappedTarget =
    targetDay >= todayStart ? addDays(todayStart, -1) : startOfDayUTC(targetDay);

  if (cappedTarget < START_OF_TRACKING) return;

  const target = cappedTarget;
  const latest = await dailySavingsModel
    .findOne({ date: { $lte: target } })
    .sort({ date: -1 })
    .lean();

  let cursorDate = latest
    ? addDays(new Date(latest.date), 1)
    : startHint
    ? startOfDayUTC(startHint)
    : undefined;
  if (!cursorDate) {
    const earliestRoom = await roomModel
      .findOne({}, { time: 1 })
      .sort({ time: 1 })
      .lean();
    if (!earliestRoom?.time) return;
    cursorDate = startOfDayUTC(new Date(earliestRoom.time));
  }
  // never backfill before tracking start
  if (cursorDate < START_OF_TRACKING) {
    cursorDate = START_OF_TRACKING;
  }
  cursorDate = startOfDayUTC(cursorDate);

  if (cursorDate > target) return;

  const cumulativeBase = latest?.cumulativeSavings ?? 0;
  const endExclusive = addDays(target, 1);

  const rooms = await roomModel
    .find({
      time: { $gte: cursorDate, $lt: endExclusive },
    })
    .sort({ time: 1 })
    .populate([
      { path: "from", select: "_id enName koName latitude longitude" },
      { path: "to", select: "_id enName koName latitude longitude" },
    ])
    .lean<PopulatedRoom[]>();

  const dayTotals = new Map<number, number>();
  for (const room of rooms) {
    const { totalSavings } = await getRoomSavings(room);
    const dayKey = startOfDayUTC(new Date(room.time)).getTime();
    dayTotals.set(dayKey, (dayTotals.get(dayKey) ?? 0) + totalSavings);
  }

  const ops = [];
  let runningTotal = cumulativeBase;
  for (
    let day = cursorDate.getTime();
    day < endExclusive.getTime();
    day += DAY_MS
  ) {
    runningTotal += dayTotals.get(day) ?? 0;
    ops.push({
      updateOne: {
        filter: { date: new Date(day) },
        update: { date: new Date(day), cumulativeSavings: runningTotal },
        upsert: true,
      },
    });
  }

  if (ops.length > 0) {
    await dailySavingsModel.bulkWrite(ops);
  }
};

export const savingsHandler: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query as unknown as SavingsQuery;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Statistics/savings : invalid date format",
      });
    }

    if (start.getTime() > end.getTime()) {
      return res.status(400).json({
        error: "Statistics/savings : startDate is after endDate",
      });
    }

    if (userId) {
      const userExists = await userModel.exists({
        _id: userId,
        withdraw: false,
      });
      if (!userExists) {
        return res.status(404).json({
          error: "Statistics/savings : user not found",
        });
      }
    }

    const cacheKey = buildStatisticsCacheKey("savings", {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      userId: userId ?? "",
    });
    const response = await getCachedOrCompute(
      cacheKey,
      CACHE_TTL_SECONDS.savings,
      async () => {
        const isTotalMode = !userId;
        const filter: FilterQuery<Room> = {
          time: { $gte: start, $lte: end },
        };
        if (!isTotalMode) {
          filter["part.user"] = new Types.ObjectId(userId);
        }

        const rooms = await roomModel
          .find(filter)
          .sort({ time: 1 })
          .populate([
            { path: "from", select: "_id enName koName latitude longitude" },
            { path: "to", select: "_id enName koName latitude longitude" },
          ])
          .lean<PopulatedRoom[]>();

        const roomSavings = [];
        let totalSavings = 0;

        for (const room of rooms) {
          const from = room.from;
          const to = room.to;

          if (!from || !to) {
            logger.warn(
              `Statistics/savings : room ${room._id} missing location info`
            );
            continue;
          }

          const participantCount = room.part?.length ?? 0;
          if (participantCount === 0) continue;

          const { estimatedFare, savingsPerUser } = await getRoomSavings(room);
          const totalSavingsForRoom = isTotalMode
            ? savingsPerUser * participantCount
            : savingsPerUser;

          roomSavings.push({
            roomId: room._id.toString(),
            from: {
              id: from._id?.toString() ?? "",
              enName: from.enName,
              koName: from.koName,
            },
            to: {
              id: to._id?.toString() ?? "",
              enName: to.enName,
              koName: to.koName,
            },
            participantCount,
            estimatedFare,
            savingsPerUser,
            totalSavingsForRoom,
            departedAt: room.time,
          });

          totalSavings += totalSavingsForRoom;
        }

        return {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          userId: userId ?? null,
          mode: isTotalMode ? "total" : "user",
          metric: "savings",
          totalSavings,
          rooms: roomSavings,
        };
      }
    );

    return res.json(response);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/savings : internal server error",
    });
  }
};

export const savingsByPeriodHandler: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query as unknown as SavingsPeriodQuery;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Statistics/savings/period : invalid date format",
      });
    }

    if (start.getTime() > end.getTime()) {
      return res.status(400).json({
        error: "Statistics/savings/period : startDate is after endDate",
      });
    }

    const startDay = startOfDayUTC(start);
    const endDay = startOfDayUTC(end);

    const cacheKey = buildStatisticsCacheKey("savings-period", {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    const response = await getCachedOrCompute(
      cacheKey,
      CACHE_TTL_SECONDS.savingsPeriod,
      async () => {
        const cumulativeEnd = await getCumulativeAt(endDay, startDay);
        const cumulativeBeforeStart = await getCumulativeAt(
          addDays(startDay, -1),
          startDay
        );
        const periodSavings = cumulativeEnd - cumulativeBeforeStart;

        return {
          metric: "savings-period",
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          totalSavings: periodSavings,
          cumulativeEnd,
          cumulativeBeforeStart,
        };
      }
    );

    return res.json(response);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/savings/period : internal server error",
    });
  }
};

export const savingsTotalHandler: RequestHandler = async (_req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDayUTC(now);
    const yesterday = addDays(todayStart, -1);
    const cacheKey = buildStatisticsCacheKey("savings-total");
    const response = await getCachedOrCompute(
      cacheKey,
      CACHE_TTL_SECONDS.savingsTotal,
      async () => {
        // 어제까지의 누적 아낀 금액을 가져옴
        const cumulativeUntilYesterday = await getCumulativeAt(yesterday);
        const totalSavings = cumulativeUntilYesterday;

        return {
          metric: "savings-total",
          asOf: now.toISOString(),
          totalSavings,
        };
      }
    );

    return res.json(response);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/savings/total : internal server error",
    });
  }
};

const calculateUserSavings = async (userId: Types.ObjectId) => {
  const rooms = await roomModel
    .find({
      part: {
        $elemMatch: {
          user: userId,
          settlementStatus: { $in: ["paid", "sent"] },
        },
      },
    })
    .populate([
      { path: "from", select: "_id enName koName latitude longitude" },
      { path: "to", select: "_id enName koName latitude longitude" },
    ])
    .lean<PopulatedRoom[]>();

  let totalSavings = 0;
  for (const room of rooms) {
    const { savingsPerUser } = await getRoomSavings(room);
    totalSavings += savingsPerUser;
  }

  return totalSavings;
};

export const userSavingsHandler: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.query as unknown as UserSavingsQuery;
    const cacheKey = buildStatisticsCacheKey("user-savings", { userId });
    const response = await getCachedOrCompute(
      cacheKey,
      CACHE_TTL_SECONDS.userSavings,
      async () => {
        const user = await userModel.findOne({ _id: userId, withdraw: false });
        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        if (user.savings === null || user.savings === undefined) {
          const totalSavings = await calculateUserSavings(user._id);
          user.savings = totalSavings;
          await user.save();
        }

        return {
          metric: "user-savings",
          userId: user._id.toString(),
          totalSavings: user.savings ?? 0,
        };
      }
    );

    return res.json(response);
  } catch (err) {
    if (err instanceof Error && err.message === "USER_NOT_FOUND") {
      return res
        .status(404)
        .json({ error: "Statistics/users/savings : user not found" });
    }
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/users/savings : internal server error",
    });
  }
};

export const userDoneRoomCountHandler: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.query as unknown as UserDoneRoomCountQuery;
    const cacheKey = buildStatisticsCacheKey("user-done-room-count", { userId });
    const response = await getCachedOrCompute(
      cacheKey,
      CACHE_TTL_SECONDS.userDoneRoomCount,
      async () => {
        const user = await userModel.findOne({ _id: userId, withdraw: false });
        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        return {
          metric: "user-done-room-count",
          userId: user._id.toString(),
          doneRoomCount: user.doneRoom?.length ?? 0,
        };
      }
    );

    return res.json(response);
  } catch (err) {
    if (err instanceof Error && err.message === "USER_NOT_FOUND") {
      return res
        .status(404)
        .json({ error: "Statistics/users/done-room-count : user not found" });
    }
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/users/done-room-count : internal server error",
    });
  }
};

export const monthlyRoomCreationHandler: RequestHandler = async (_req, res) => {
  try {
    const cacheKey = buildStatisticsCacheKey("monthly-room-creation");
    const response = await getCachedOrCompute(
      cacheKey,
      CACHE_TTL_SECONDS.monthlyRoomCreation,
      async () => {
        const todayKST = startOfMonthKST(new Date());
        const lastMonthStart = addMonths(todayKST, -1);

        if (lastMonthStart < START_OF_MONTH_TRACKING) {
          return {
            metric: "monthly-room-creation",
            timezone: SEOUL_TIMEZONE,
            range: null,
            months: [],
          };
        }

        await ensureMonthlyRoomsThrough(lastMonthStart);

        const months = await monthlyRoomCreationModel
          .find({ month: { $lte: lastMonthStart } })
          .sort({ month: 1 })
          .lean();

        const responseMonths = months.map((doc) => ({
          month: doc.month.toISOString(),
          cumulativeRooms: doc.cumulativeRooms,
        }));

        return {
          metric: "monthly-room-creation",
          timezone: SEOUL_TIMEZONE,
          range: {
            startMonth: responseMonths[0]?.month ?? null,
            endMonth: responseMonths.at(-1)?.month ?? null,
          },
          months: responseMonths,
        };
      }
    );

    return res.json(response);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/room-creation/monthly : internal server error",
    });
  }
};

export const monthlyUserCreationHandler: RequestHandler = async (_req, res) => {
  try {
    const cacheKey = buildStatisticsCacheKey("monthly-user-creation");
    const response = await getCachedOrCompute(
      cacheKey,
      CACHE_TTL_SECONDS.monthlyUserCreation,
      async () => {
        const todayKST = startOfMonthKST(new Date());
        const lastMonthStart = addMonths(todayKST, -1);

        if (lastMonthStart < START_OF_MONTH_TRACKING) {
          return {
            metric: "monthly-user-creation",
            timezone: SEOUL_TIMEZONE,
            range: null,
            months: [],
          };
        }

        await ensureMonthlyUsersThrough(lastMonthStart);

        const months = await monthlyUserCreationModel
          .find({ month: { $lte: lastMonthStart } })
          .sort({ month: 1 })
          .lean();

        const responseMonths = months.map((doc) => ({
          month: doc.month.toISOString(),
          cumulativeUsers: doc.cumulativeUsers,
        }));

        return {
          metric: "monthly-user-creation",
          timezone: SEOUL_TIMEZONE,
          range: {
            startMonth: responseMonths[0]?.month ?? null,
            endMonth: responseMonths.at(-1)?.month ?? null,
          },
          months: responseMonths,
        };
      }
    );

    return res.json(response);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/users/monthly : internal server error",
    });
  }
};

export const hourlyRoomCreationHandler: RequestHandler = async (req, res) => {
  try {
    const { locationId, dayOfWeek } =
      req.query as unknown as HourlyRoomCreationQuery;

    // Fixed window: last 28 days (yesterday back 27), in KST.
    const todayKST = startOfDayKST(new Date());
    const endExclusive = todayKST;
    const start = addDays(endExclusive, -28);

    const location = await locationModel
      .findById(locationId, "enName koName")
      .lean();
    if (!location) {
      return res.status(404).json({
        error: "Statistics/hourly-room-creation : location not found",
      });
    }

    const cacheKey = buildStatisticsCacheKey("hourly-room-creation", {
      locationId,
      dayOfWeek,
      startDate: start.toISOString(),
      endDate: endExclusive.toISOString(),
    });
    const response = await getCachedOrCompute(
      cacheKey,
      CACHE_TTL_SECONDS.hourlyRoomCreation,
      async () => {
        const locationObjectId = new Types.ObjectId(locationId);
        const targetDayOfWeek = dayOfWeek + 1; // MongoDB dayOfWeek starts from 1 (Sunday)

        const aggregationPipeline: PipelineStage[] = [
          {
            $match: {
              from: locationObjectId,
              time: { $type: "date", $gte: start, $lt: endExclusive },
            },
          },
          {
            $addFields: {
              dayOfWeek: {
                $dayOfWeek: { date: "$time", timezone: SEOUL_TIMEZONE },
              },
            },
          },
          { $match: { dayOfWeek: targetDayOfWeek } },
          {
            $facet: {
              hourly: [
                {
                  $group: {
                    _id: {
                      hour: {
                        $hour: { date: "$time", timezone: SEOUL_TIMEZONE },
                      },
                    },
                    count: { $sum: 1 },
                  },
                },
              ],
            },
          },
        ];

        const [aggregationResult] = await roomModel.aggregate<{
          hourly: { _id: { hour: number }; count: number }[];
          days: { value: number }[];
        }>(aggregationPipeline);

        const hourlyCounts = Array(24).fill(0);
        const hourly = aggregationResult?.hourly ?? [];
        for (const entry of hourly) {
          const hour = entry?._id?.hour;
          if (typeof hour === "number" && hour >= 0 && hour < 24) {
            hourlyCounts[hour] = entry.count ?? 0;
          }
        }

        const intervals = hourlyCounts.map((totalRooms, hour) => ({
          hour,
          timeRange: `${String(hour).padStart(2, "0")}:00-${String(
            hour + 1
          ).padStart(2, "0")}:00`,
          totalRooms,
        }));

        return {
          metric: "hourly-room-creation",
          timezone: SEOUL_TIMEZONE,
          startDate: start.toISOString(),
          endDate: new Date(endExclusive.getTime() - 1).toISOString(),
          location: {
            id: location._id.toString(),
            enName: location.enName,
            koName: location.koName,
          },
          dayOfWeek,
          intervals,
        };
      }
    );

    return res.json(response);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/hourly-room-creation : internal server error",
    });
  }
};
