import { z } from "zod";
import { zodToSchemaObject, zStringToBoolean } from "../utils";
import patterns from "@/modules/patterns";

const { jwtToken, base64url } = patterns;

const tokenObject = z.object({
  accessToken: z.string().regex(jwtToken),
  deviceToken: z.string(), // FCM Token (spec does not exist at docs)
});

export const authZod = {
  sparcsssoHandler: z
    .object({
      redirect: z.string(),
      isApp: zStringToBoolean.default("false"),
    })
    .partial({
      redirect: true,
    }),
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
  oneAppLoginHandler: z.object({
    // RFC 7636: 43 characters for SHA-256 base64url encoding
    codeChallenge: z.string().regex(base64url).length(43),
  }),
  oneAppTokenIssueHandler: z.object({
    // RFC 7636: between 43 and 128 characters
    codeVerifier: z.string().regex(base64url).min(43).max(128),
  }),
  oneAppTokenRefreshHandler: z.object({
    refreshToken: z.string().min(1), // Not a JWT
  }),
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
export type OneAppLoginQuery = z.infer<typeof authZod.oneAppLoginHandler>;
export type OneAppTokenIssueBody = z.infer<
  typeof authZod.oneAppTokenIssueHandler
>;
export type OneAppTokenRefreshBody = z.infer<
  typeof authZod.oneAppTokenRefreshHandler
>;
