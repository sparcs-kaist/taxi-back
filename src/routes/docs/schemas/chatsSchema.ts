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
  sendChatHandler: z.object({
    roomId: z.string().regex(objectId),
    type: z.string().regex(chat.chatSendType),
    content: z.string().regex(chat.chatContent).regex(chat.chatContentLength),
  }),
  readChatHandler: z.object({
    roomId: z.string().regex(objectId),
  }),
  uploadChatImgGetPUrlHandler: z.object({
    type: z.string().regex(chat.chatImgType),
  }),
  uploadChatImgDoneHandler: z.object({
    id: z.string().regex(objectId),
  }),
};

export const chatsSchema = zodToSchemaObject(chatsZod);
