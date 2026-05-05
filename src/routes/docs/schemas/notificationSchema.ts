import { z } from "zod";
import { zodToSchemaObject } from "@/routes/docs/utils";

export const notificationZod = {
  registerDeviceTokenHandler: z.object({
    deviceToken: z.string().min(1).max(1024),
  }),
  editOptionsHandler: z.object({
    options: z
      .object({
        chatting: z.boolean(),
        keywords: z.array(z.string()),
        beforeDepart: z.boolean(),
        notice: z.boolean(),
        advertisement: z.boolean(),
      })
      .partial(),
  }),
};

export const notificationSchema = zodToSchemaObject(notificationZod);
export type RegisterDeviceTokenHandlerType = z.infer<
  typeof notificationZod.registerDeviceTokenHandler
>;
export type EditOptionsHandlerType = z.infer<
  typeof notificationZod.editOptionsHandler
>;
