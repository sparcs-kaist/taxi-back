import "@/loadenv";
import { mongo as mongoUrl } from "@/loadenv";
import logger from "@/modules/logger";
import {
  connectDatabase,
  roomModel,
  dailySavingsModel,
} from "@/modules/stores/mongo";
import {
  ensureCumulativeSavingsThrough,
  startOfDayUTC,
} from "@/services/statistics";

const main = async () => {
  connectDatabase(mongoUrl);

  const earliestRoom = await roomModel
    .findOne({}, { time: 1 })
    .sort({ time: 1 })
    .lean();

  if (!earliestRoom?.time) {
    logger.info("backfillDailySavings : no rooms found, nothing to backfill");
    return;
  }

  const startHint = startOfDayUTC(new Date(earliestRoom.time));
  const targetDay = startOfDayUTC(new Date());

  logger.info(
    `backfillDailySavings : backfilling from ${startHint.toISOString()} to ${targetDay.toISOString()}`
  );

  await ensureCumulativeSavingsThrough(targetDay, startHint);

  const latest = await dailySavingsModel.findOne({}).sort({ date: -1 }).lean();
  logger.info(
    `backfillDailySavings : latest cumulative ${latest?.cumulativeSavings ?? 0} at ${latest?.date?.toISOString()}`
  );
};

main()
  .then(() => {
    logger.info("backfillDailySavings : done");
    process.exit(0);
  })
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
