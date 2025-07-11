import { z } from "zod";
import patterns from "@/modules/patterns";
import { zodToSchemaObject } from "../utils";

export const roomsZod = {
  searchRooms: z
    .object({
      name: z.string().regex(patterns.room.name),
      from: z.string().regex(patterns.objectId),
      to: z.string().regex(patterns.objectId),
      time: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid ISO date format",
      }),
      withTime: z.coerce.boolean(),
      maxPartLength: z.coerce.number().int().min(2).max(4),
      isHome: z.coerce.boolean(),
    })
    .partial(),

  roomIdQuery: z.object({
    id: z.string().regex(patterns.objectId),
  }),

  createRoom: z.object({
    name: z.string().regex(patterns.room.name),
    from: z.string().regex(patterns.objectId),
    to: z.string().regex(patterns.objectId),
    time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid ISO date format",
    }),
    maxPartLength: z.number().int().min(2).max(4),
  }),

  createRoomTest: z.object({
    from: z.string().regex(patterns.objectId),
    to: z.string().regex(patterns.objectId),
    time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid ISO date format",
    }),
    maxPartLength: z.number().int().min(2).max(4),
  }),

  roomIdBody: z.object({
    roomId: z.string().regex(patterns.objectId),
  }),

  commitSettlement: z.object({
    roomId: z.string().regex(patterns.objectId),
  }),

  commitPayment: z.object({
    roomId: z.string().regex(patterns.objectId),
  }),
};

export const roomsSchema = zodToSchemaObject(roomsZod);

export type SearchRoomsParams = z.infer<typeof roomsZod.searchRooms>;
export type RoomIdQueryParams = z.infer<typeof roomsZod.roomIdQuery>;
export type CreateRoomBody = z.infer<typeof roomsZod.createRoom>;
export type RoomIdBody = z.infer<typeof roomsZod.roomIdBody>;
