import type { RequestHandler } from "express";
import { mileageModel } from "@/modules/stores/mongo";
import { LeaderboardQuery } from "../routes/docs/schemas/mileageSchema";

type Period = {
  start: Date | null;
  end: Date | null;
};

export const leaderboardHandler: RequestHandler = async (req, res) => {
  const { limit } = req.query as unknown as LeaderboardQuery;

  if (limit <= 0) {
    return res.status(400).json({
      error: "Mileage: limit should be positive integer",
    });
  }

  const rows = await getTopN({ start: null, end: null }, limit);
  return res.json(rows);
};

/**
 *
 * @param period - 상위 N명을 뽑을 기간입니다. {start: Date | null, end: Date | null}
 * @param limit - 뽑을 등수입니다. 최대 limit 등까지 뽑습니다.
 * @description 1. 만약 start가 null이라면 end까지 적립된 모든 마일리지를 리턴
 * 2. 만약 end가 null이라면 현재까지 적립된 모든 마일리지를 리턴
 * 3. 만약 둘 모두가 값이 있다면 해당 기간 내에 적립된 모든 마일리지를 리턴
 * 4. 만약 동점자가 있다면 다음 등수는 스킵됩니다. (1, 2, 2, 4)
 * 5. 리턴되는 array의 length는 limit을 초과할 수 있습니다 (동점자일 시).
 */
export const getTopN = async (period: Period, limit: number) => {
  const end = period.end ? period.end : new Date();

  const query = period.start
    ? { createAt: { $lte: end, $gte: period.start } }
    : { createAt: { $lte: end } };

  return mileageModel.aggregate([
    { $match: query },
    { $group: { _id: "$user", totalMileage: { $sum: "$amount" } } },
    { $sort: { totalMileage: -1 } },
    {
      $setWindowFields: {
        sortBy: { totalMileage: -1 },
        output: { rank: { $rank: {} } },
      },
    },
    { $match: { rank: { $lte: limit } } },
    { $project: { _id: 0, user: "$_id", totalMileage: 1, rank: 1 } },
  ]);
};
