import { z } from "zod";
import { zodToSchemaObject } from "../utils";
import patterns from "@/modules/patterns";

const { jwtToken } = patterns;

const tokenObject = z.object({
  accessToken: z.string().regex(jwtToken),
  deviceToken: z.string().regex(jwtToken),
});

export const authZod = {
  sparcsssoHandler: z
    .object({
      redirect: z.string(),
      isApp: z.enum(["true", "false"]).transform((value) => value === "true"),
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
  tokenLoginHandler: tokenObject,
  tokenRefreshHandler: z.object({
    accessToken: z.string().regex(jwtToken),
    refreshToken: z.string().regex(jwtToken),
  }),
  registerDeviceTokenHandler: tokenObject,
  removeDeviceTokenHandler: tokenObject,
};

export const authSchema = zodToSchemaObject(authZod);

export type SparcsssoQuery = z.infer<typeof authZod.sparcsssoHandler>;
export type LoginReplaceBody = z.infer<typeof authZod.loginReplaceHandler>;
export type LogoutQuery = z.infer<typeof authZod.logoutHandler>;
export type TokenLoginQuery = z.infer<typeof authZod.tokenLoginHandler>;
export type TokenRefreshQuery = z.infer<typeof authZod.tokenRefreshHandler>;
export type RegisterDeviceTokenBody = z.infer<
  typeof authZod.registerDeviceTokenHandler
>;
export type RemoveDeviceTokenBody = z.infer<
  typeof authZod.removeDeviceTokenHandler
>;
