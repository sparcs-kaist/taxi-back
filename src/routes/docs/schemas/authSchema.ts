import { z } from "zod";
import { zodToSchemaObject } from "../utils";

export const authZod = {
  sparcsssoHandler: z
    .object({
      redirect: z.string(),
      isApp: z.coerce.boolean(),
    })
    .partial(),
  loginReplaceHandler: z
    .object({
      id: z.string(),
      redirect: z.string(),
    })
    .partial({
      redirect: true,
    }),
  logoutHandler: z
    .object({
      redirect: z.string(),
    })
    .partial(),
};

export const authSchema = zodToSchemaObject(authZod);

export type SparcsssoQuery = z.infer<typeof authZod.sparcsssoHandler>;
export type LoginReplaceBody = z.infer<typeof authZod.loginReplaceHandler>;
export type LogoutQuery = z.infer<typeof authZod.logoutHandler>;
