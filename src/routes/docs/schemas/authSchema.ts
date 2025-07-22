import { z } from "zod";
import { zodToSchemaObject } from "../utils";

export const authZod = {
  sparcsssoHandler: z.object({
    redirect: z.string().optional(),
    isApp: z.coerce.boolean().optional(),
  }),
  loginReplaceHandler: z.object({
    id: z.string(),
    redirect: z.string().optional(),
  }),
  logoutHandler: z.object({
    redirect: z.string().optional(),
  }),
};

export const authSchema = zodToSchemaObject(authZod);

export type SparcsssoQuery = z.infer<typeof authZod.sparcsssoHandler>;
export type LoginReplaceBody = z.infer<typeof authZod.loginReplaceHandler>;
export type LogoutQuery = z.infer<typeof authZod.logoutHandler>;
