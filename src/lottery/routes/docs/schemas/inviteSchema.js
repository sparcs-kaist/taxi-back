const { z } = require("zod");
const { zodToSchemaObject } = require("../../../../routes/docs/utils");
const { objectId } = require("../../../../modules/patterns");

const inviteZod = {
  searchInviterHandler: z.object({
    inviter: z.string().regex(objectId),
  }),
};

const inviteSchema = zodToSchemaObject(inviteZod);

module.exports = { inviteSchema, inviteZod };
