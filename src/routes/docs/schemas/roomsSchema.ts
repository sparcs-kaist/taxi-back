// src/schemas/roomsSchema.ts

import { z } from "zod";
import patterns from "@/modules/patterns";

const mongoId = /^[0-9a-fA-F]{24}$/;

export const roomsZod = {
  searchRooms: z.object({
    name: z.string().regex(patterns.room.name),
    from: z.string().regex(mongoId),
    to: z.string().regex(mongoId),
    time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid ISO date format",
    }),
    withTime: z.coerce.boolean(),
    maxPartLength: z.coerce.number().int().min(2).max(4),
    isHome: z.coerce.boolean(),
  }).partial(),

  roomIdQuery: z.object({
    id: z.string().regex(mongoId),
  }),

  createRoom: z.object({
    name: z.string().regex(patterns.room.name),
    from: z.string().regex(mongoId),
    to: z.string().regex(mongoId),
    time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid ISO date format",
    }),
    maxPartLength: z.number().int().min(2).max(4),
  }),

  roomIdBody: z.object({
    roomId: z.string().regex(mongoId),
  }),

  commitSettlement: z.object({
    roomId: z.string().regex(mongoId),
  }),

  commitPayment: z.object({
    roomId: z.string().regex(mongoId),
  }),
};

export type SearchRoomsParams = z.infer<typeof roomsZod.searchRooms>;
export type RoomIdQueryParams = z.infer<typeof roomsZod.roomIdQuery>;
export type CreateRoomBody = z.infer<typeof roomsZod.createRoom>;
export type RoomIdBody = z.infer<typeof roomsZod.roomIdBody>;
