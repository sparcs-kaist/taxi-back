import { z } from "zod";
import { zodToSchemaObject } from "../utils";
import patterns from "@/modules/patterns";

export const reportsZod = {
  createHandler: z
    .object({
      reportedId: z.string().regex(patterns.objectId),
      type: z.enum(["no-settlement", "no-show", "etc-reason"]),
      etcDetail: z.string().max(30).default(""),
      time: z.string().datetime(),
      roomId: z.string().regex(patterns.objectId),
    })
    .partial({ etcDetail: true }),
};

export const reportsSchema = zodToSchemaObject(reportsZod);

export type ReportsCreate = z.infer<typeof reportsZod.createHandler>;
