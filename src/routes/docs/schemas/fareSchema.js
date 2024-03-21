const { z } = require("zod");
const { zodToSchemaObject } = require("../utils");
const { objectId } = require("../../../modules/patterns");

const fareZod = {
  getTaxiFare: z.object({
    from: z.string().regex(objectId),
    to: z.string().regex(objectId),
    time: z.string().datetime(),
  }),
};
const fareSchema = zodToSchemaObject(fareZod);

module.exports = { fareSchema, fareZod };
