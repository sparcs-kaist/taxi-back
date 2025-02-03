const { z } = require("zod");
const { zodToSchemaObject } = require("../../../../routes/docs/utils");
const { objectId } = require("../../../../modules/patterns").default;

const invitesZod = {
  searchInviterHandler: z.object({
    inviter: z.string().regex(objectId),
  }),
};

const invitesSchema = zodToSchemaObject(invitesZod);

module.exports = { invitesZod, invitesSchema };
