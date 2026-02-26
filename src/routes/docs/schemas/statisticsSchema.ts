import { z } from "zod";
import patterns from "@/modules/patterns";
import { zodToSchemaObject } from "../utils";

const dateString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date format",
  });
const dayOfWeek = z.coerce.number().int().min(0).max(6);

export const statisticsZod = {
  savingsHandler: z.object({
    startDate: dateString,
    endDate: dateString,
    userId: z.string().regex(patterns.objectId).optional(),
  }),
  hourlyRoomCreationHandler: z.object({
    locationId: z.string().regex(patterns.objectId),
    dayOfWeek,
  }),
  savingsPeriodHandler: z.object({
    startDate: dateString,
    endDate: dateString,
  }),
  savingsTotalHandler: z.object({}),
  userSavingsHandler: z.object({
    userId: z.string().regex(patterns.objectId),
  }),
  monthlyRoomCreationHandler: z.object({}),
  monthlyUserCreationHandler: z.object({}),
  userDoneRoomCountHandler: z.object({
    userId: z.string().regex(patterns.objectId),
  }),
};

export const statisticsSchema = zodToSchemaObject(statisticsZod);

export type SavingsQuery = z.infer<typeof statisticsZod.savingsHandler>;
export type HourlyRoomCreationQuery = z.infer<
  typeof statisticsZod.hourlyRoomCreationHandler
>;
export type SavingsPeriodQuery = z.infer<
  typeof statisticsZod.savingsPeriodHandler
>;
export type SavingsTotalQuery = z.infer<
  typeof statisticsZod.savingsTotalHandler
>;
export type UserSavingsQuery = z.infer<
  typeof statisticsZod.userSavingsHandler
>;
export type MonthlyRoomCreationQuery = z.infer<
  typeof statisticsZod.monthlyRoomCreationHandler
>;
export type MonthlyUserCreationQuery = z.infer<
  typeof statisticsZod.monthlyUserCreationHandler
>;
export type UserDoneRoomCountQuery = z.infer<
  typeof statisticsZod.userDoneRoomCountHandler
>;
