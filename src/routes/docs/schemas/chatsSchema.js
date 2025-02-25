const { z } = require("zod");
const { zodToSchemaObject } = require("../utils");
const { objectId, chat } = require("@/modules/patterns").default;

const chatsZod = {
  sendChatHandler: z.object({
    roomId: z.string().regex(objectId),
    type: z.string().regex(chat.chatSendType),
    content: z.string().regex(chat.chatContent).regex(chat.chatContentLength),
  }),
};

const chatsSchema = zodToSchemaObject(chatsZod);

module.exports = { chatsZod, chatsSchema };
