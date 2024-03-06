const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const questsZod = {
  completeHandler: z
    .object({ questId: z.enum(["roomSharing"]) })
    .required({ questId: true }),
};

const questsSchema = {
  completeHandler: zodToJsonSchema(questsZod.completeHandler),
};

module.exports = { questsZod, questsSchema };
