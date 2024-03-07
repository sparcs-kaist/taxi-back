const { z } = require("zod");
const { zodToSchemaObject } = require("../../../../routes/docs/utils");

const questsZod = {
  completeHandler: z.object({ questId: z.enum(["roomSharing"]) }),
};

const questsSchema = zodToSchemaObject(questsZod);

module.exports = { questsZod, questsSchema };
