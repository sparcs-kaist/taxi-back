import { z } from "zod";
import { zodToSchemaObject } from "@/routes/docs/utils";

export const notificationZod = {
  registerDeviceTokenHandler: z.object({
    deviceToken: z.string().min(1).max(1024),
  }),
  editOptionsHandler: z.object({
    options: z.object({
      chatting: z.boolean().optional(),
      keywords: z.array(z.string()).optional(),
      beforeDepart: z.boolean().optional(),
      notice: z.boolean().optional(),
      advertisement: z.boolean().optional(),
    }),
  }),
};

export const notificationSchema = zodToSchemaObject(notificationZod);
