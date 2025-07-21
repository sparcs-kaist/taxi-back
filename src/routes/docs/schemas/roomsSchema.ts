import { z } from "zod";
import patterns from "@/modules/patterns";
import { zodToSchemaObject } from "../utils";

export const roomsZod = {
  searchHandler: z
    .object({
      name: z.string().regex(patterns.room.name),
      from: z.string().regex(patterns.objectId),
      to: z.string().regex(patterns.objectId),
      time: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid ISO date format",
      }),
      withTime: z.coerce.boolean(),
      maxPartLength: z.coerce.number().int().min(2).max(4),
      isHome: z.coerce.boolean(),
    })
    .partial(),

  searchByTimeGapHandler: z.object({
    from: z.string().regex(patterns.objectId),
    to: z.string().regex(patterns.objectId),
    time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid ISO date format",
    }),
    timeGap: z.coerce.number().int().min(0).max(60).optional(),
  }),

  publicInfoHandler: z.object({
    id: z.string().regex(patterns.objectId),
  }),

  infoHandler: z.object({
    id: z.string().regex(patterns.objectId),
  }),

  createHandler: z.object({
    name: z.string().regex(patterns.room.name),
    from: z.string().regex(patterns.objectId),
    to: z.string().regex(patterns.objectId),
    time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid ISO date format",
    }),
    maxPartLength: z.coerce.number().int().min(2).max(4),
  }),

  createTestHandler: z.object({
    from: z.string().regex(patterns.objectId),
    to: z.string().regex(patterns.objectId),
    time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid ISO date format",
    }),
    maxPartLength: z.coerce.number().int().min(2).max(4),
  }),

  joinHandler: z.object({
    roomId: z.string().regex(patterns.objectId),
  }),

  abortHandler: z.object({
    roomId: z.string().regex(patterns.objectId),
  }),

  commitSettlementHandler: z.object({
    roomId: z.string().regex(patterns.objectId),
  }),

  commitPaymentHandler: z.object({
    roomId: z.string().regex(patterns.objectId),
  }),
};

export const roomsSchema = zodToSchemaObject(roomsZod);

export type SearchQuery = z.infer<typeof roomsZod.searchHandler>;
export type SearchByTimeGapQuery = z.infer<
  typeof roomsZod.searchByTimeGapHandler
>;
export type PublicInfoQuery = z.infer<typeof roomsZod.publicInfoHandler>;
export type InfoQuery = z.infer<typeof roomsZod.infoHandler>;
export type CreateBody = z.infer<typeof roomsZod.createHandler>;
export type CreateTestBody = z.infer<typeof roomsZod.createTestHandler>;
export type JoinBody = z.infer<typeof roomsZod.joinHandler>;
export type AbortBody = z.infer<typeof roomsZod.abortHandler>;
export type CommitSettlementBody = z.infer<
  typeof roomsZod.commitSettlementHandler
>;
export type CommitPaymentBody = z.infer<typeof roomsZod.commitPaymentHandler>;
