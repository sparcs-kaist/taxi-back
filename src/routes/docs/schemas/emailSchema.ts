import { z } from "zod";
import { zodToSchemaObject } from "../utils";

export const emailZod = {
  emailTrackingHandler: z.object({
    trackingId: z.string().uuid(), // 트래킹 ID
  }),
};

export const emailSchema = zodToSchemaObject(emailZod);
