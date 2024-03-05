const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { objectIdPattern } = require("../utils");

const reportsZod = {
  createHandler: z
    .object({
      reportedId: z.string().regex(new RegExp(objectIdPattern)),
      type: z.enum(["no-settlement", "no-show", "etc-reason"]),
      etcDetail: z.string().max(30).default(""),
      time: z.string().datetime(),
      roomId: z.string().regex(new RegExp(objectIdPattern)),
    })
    .required({ reportedId: true, type: true, time: true, roomId: true }),
};

const reportsSchema = {
  createHandler: zodToJsonSchema(reportsZod.createHandler),
};

module.exports = { reportsSchema, reportsZod };
