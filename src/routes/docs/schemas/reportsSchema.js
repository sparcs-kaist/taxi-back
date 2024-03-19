const { z } = require("zod");
const { zodToSchemaObject } = require("../utils");
const { objectId } = require("../../../modules/patterns");

const reportsZod = {
  createHandler: z
    .object({
      reportedId: z.string().regex(objectId),
      type: z.enum(["no-settlement", "no-show", "etc-reason"]),
      etcDetail: z.string().max(30).default(""),
      time: z.string().datetime(),
      roomId: z.string().regex(objectId),
    })
    .partial({ etcDetail: true }),
};

const reportsSchema = zodToSchemaObject(reportsZod);

module.exports = { reportsSchema, reportsZod };
