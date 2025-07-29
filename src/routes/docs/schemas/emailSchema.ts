import { z } from "zod";
import { zodToSchemaObject } from "../utils";

export const emailZod = {
  emailHandler: z.object({
    trackingId: z.string(), // 트래킹 ID
  }),
};

export const emailSchema = zodToSchemaObject(emailZod);
