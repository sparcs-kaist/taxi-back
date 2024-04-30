const { z } = require("zod");
const { zodToSchemaObject } = require("../utils");
const { objectId, room } = require("../../../modules/patterns").default;

const roomsZod = {};
roomsZod["part"] = z
  .object({
    _id: z.string().regex(objectId),
    name: z.string(),
    nickname: z.string(),
    profileImageUrl: z.string(),
    isSettlement: z
      .enum(["not-departed", "paid", "send-required", "sent"])
      .default("not-departed"),
    readAt: z.string().datetime(),
  })
  .partial({ isSettlement: true });

roomsZod["room"] = z
  .object({
    name: z.string().regex(room.name),
    from: z.string().regex(objectId),
    to: z.string().regex(objectId),
    time: z.string().datetime(),
    part: z.array(roomsZod["part"]),
    madeat: z.string().datetime(),
    maxPartLength: z.number().lte(4),
    settlementTotal: z.number().default(0),
    isOver: z.boolean(),
    isDeparted: z.boolean(),
  })
  .partial({ settlementTotal: true, isOver: true });

const roomsSchema = zodToSchemaObject(roomsZod);

module.exports = { roomsSchema, roomsZod };
