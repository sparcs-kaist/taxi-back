const { z } = require("zod");
const { zodToSchemaObject } = require("../../../../routes/docs/utils");
const { objectId, user } = require("../../../../modules/patterns").default;

const globalStateZod = {
  createUserGlobalStateHandler: z
    .object({
      phoneNumber: z.string().regex(user.phoneNumber),
      inviter: z.string().regex(objectId),
    })
    .partial({ inviter: true }),
};

const globalStateSchema = zodToSchemaObject(globalStateZod);

module.exports = { globalStateZod, globalStateSchema };
