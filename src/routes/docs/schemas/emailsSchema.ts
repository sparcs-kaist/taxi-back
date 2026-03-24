import { z } from "zod";
import { zodToSchemaObject } from "../utils";

export const emailsZod = {
  emailTrackingHandler: z.object({
    trackingId: z.string().uuid(), // 트래킹 ID
  }),
};

export const emailsSchema = zodToSchemaObject(emailsZod);
