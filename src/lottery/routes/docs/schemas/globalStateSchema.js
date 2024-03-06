const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const globalStateZod = {
  createUserGlobalStateHandler: z
    .object({
      phoneNumber: z
        .string()
        .regex(new RegExp("^010-?([0-9]{3,4})-?([0-9]{4})$")),
      group: z.number().gte(1).lte(26),
      inviter: z.string().regex(new RegExp("^[a-fA-F\\d]{24}$")),
    })
    .required({ phoneNumber: true, group: true }),
};

const globalStateSchema = {
  createUserGlobalStateHandler: zodToJsonSchema(
    globalStateZod.createUserGlobalStateHandler
  ),
};

module.exports = { globalStateZod, globalStateSchema };
