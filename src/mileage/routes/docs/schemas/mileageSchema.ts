import { z } from "zod";
import { zodToSchemaObject } from "@/routes/docs/utils";

export const mileageZod = {
  transactionViewHandler: z.object({
    type: z.string(),
    page: z.number(),
  }),
  leaderboardHandler: z.object({
    limit: z.number().int().positive(),
  }),
};

export const mileageSchema = zodToSchemaObject(mileageZod);

export type TransactionViewQuery = z.infer<
  typeof mileageZod.transactionViewHandler
>;
export type LeaderboardQuery = z.infer<typeof mileageZod.leaderboardHandler>;
