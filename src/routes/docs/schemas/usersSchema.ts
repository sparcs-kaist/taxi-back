import { z } from "zod";
import patterns from "@/modules/patterns";
import { zodToSchemaObject, zStringToBoolean } from "../utils";
import { replaceSpaceInNickname } from "@/modules/modifyProfile";

export const usersZod = {
  editNicknameHandler: z.object({
    nickname: z
      .string()
      .transform(replaceSpaceInNickname)
      .pipe(z.string().regex(patterns.user.nickname)),
  }),

  editAccountHandler: z.object({
    account: z.string().regex(patterns.user.account),
  }),

  registerPhoneNumberHandler: z.object({
    phoneNumber: z.string().regex(patterns.user.phoneNumber),
  }),

  editBadgeHandler: z.object({
    badge: zStringToBoolean.default("false"),
  }),

  registerResidenceHandler: z.object({
    residence: z.string().trim().min(1).max(15),
  }),

  editProfileImgGetPUrlHandler: z.object({
    type: z.string().regex(patterns.user.profileImgType),
  }),
};

export const usersSchema = zodToSchemaObject(usersZod);

export type EditNicknameBody = z.infer<typeof usersZod.editNicknameHandler>;
export type EditAccountBody = z.infer<typeof usersZod.editAccountHandler>;
export type RegisterPhoneNumberBody = z.infer<
  typeof usersZod.registerPhoneNumberHandler
>;
export type RegisterResidenceBody = z.infer<
  typeof usersZod.registerResidenceHandler
>;
export type EditProfileImgGetPUrlBody = z.infer<
  typeof usersZod.editProfileImgGetPUrlHandler
>;
