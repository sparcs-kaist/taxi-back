import { z } from "zod";
import { zodToSchemaObject } from "@/routes/docs/utils";

export const mileageZod = {
  transactionCreateHandler: z.object({
    type: z.string(),
    amount: z.number(),
  }),
  transactionViewHandler: z.object({
    type: z.string(),
    page: z.number(),
  }),
  leaderboardHandler: z.object({
    limit: z.number(),
  }),
};

export const mileageSchema = zodToSchemaObject(mileageZod);

export type TransactionCreateBody = z.infer<
  typeof mileageZod.transactionCreateHandler
>;
export type TransactionViewQuery = z.infer<
  typeof mileageZod.transactionViewHandler
>;
export type LeaderboardQuery = z.infer<typeof mileageZod.leaderboardHandler>;
