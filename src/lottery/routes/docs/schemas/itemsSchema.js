const { z } = require("zod");
const { zodToSchemaObject } = require("../../../../routes/docs/utils");
const { objectId } = require("../../../../modules/patterns").default;

const itemsZod = {
  getItemHandler: z.object({
    itemId: z.string().regex(objectId),
  }),
  getItemLeaderboardHandler: z.object({
    itemId: z.string().regex(objectId),
  }),
  purchaseItemHandlerParams: z.object({
    itemId: z.string().regex(objectId),
  }),
  purchaseItemHandlerBody: z.object({
    amount: z.number().int().positive(),
  }),
};

const itemsSchema = zodToSchemaObject(itemsZod);

module.exports = { itemsZod, itemsSchema };
