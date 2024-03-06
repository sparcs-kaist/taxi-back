const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const inviteZod = {
  searchInviterHandler: z
    .object({
      inviter: z.string().regex(new RegExp("^[a-fA-F\\d]{24}$")),
    })
    .required({ inviter: true }),
};

const inviteSchema = {
  searchInviterHandler: zodToJsonSchema(inviteZod.searchInviterHandler),
};

module.exports = { inviteSchema, inviteZod };
