import { z } from "zod";
import { zodToSchemaObject } from "../utils";
import patterns from "@/modules/patterns";

const { objectId, chat } = patterns;

export const chatsZod = {
  loadRecentChatHandler: z.object({
    roomId: z.string().regex(objectId),
  }),
  loadBeforeChatHandler: z.object({
    roomId: z.string().regex(objectId),
    lastMsgDate: z.string().datetime({
      offset: true,
      message: "Invalid ISO date format",
    }),
  }),
  loadAfterChatHandler: z.object({
    roomId: z.string().regex(objectId),
    lastMsgDate: z.string().datetime({
      offset: true,
      message: "Invalid ISO date format",
    }),
  }),
  // sendChatHandler.type should match ChatType at types/mongo.d.ts
  sendChatHandler: z.object({
    roomId: z.string().regex(objectId),
    type: z.enum(["text", "account"]),
    content: z.string().regex(chat.chatContent).regex(chat.chatContentLength),
  }),
  readChatHandler: z.object({
    roomId: z.string().regex(objectId),
  }),
  uploadChatImgGetPUrlHandler: z.object({
    type: z.enum(["image/png", "image/jpg", "image/jpeg"]),
    roomId: z.string().regex(objectId),
  }),
  uploadChatImgDoneHandler: z.object({
    id: z.string().regex(objectId),
  }),
};

export const chatsSchema = zodToSchemaObject(chatsZod);

export type LoadRecentChatBody = z.infer<typeof chatsZod.loadRecentChatHandler>;
export type LoadBeforeChatBody = z.infer<typeof chatsZod.loadBeforeChatHandler>;
export type LoadAfterChatBody = z.infer<typeof chatsZod.loadAfterChatHandler>;
export type ReadChatBody = z.infer<typeof chatsZod.readChatHandler>;
export type SendChatBody = z.infer<typeof chatsZod.sendChatHandler>;
export type UploadChatImgGetPUrlBody = z.infer<
  typeof chatsZod.uploadChatImgGetPUrlHandler
>;
export type UploadChatImgDoneBody = z.infer<
  typeof chatsZod.uploadChatImgDoneHandler
>;
