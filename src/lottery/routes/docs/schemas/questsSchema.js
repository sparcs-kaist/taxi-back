const { z } = require("zod");
const { zodToSchemaObject } = require("../../../../routes/docs/utils");

const questsZod = {
  completeQuestHandler: z.object({
    questId: z.enum(["roomSharing", "dailyAttendance"]),
  }),
};

const questsSchema = zodToSchemaObject(questsZod);

module.exports = { questsZod, questsSchema };
