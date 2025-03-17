import { z } from "zod";
import patterns from "@/modules/patterns";

const objectId = patterns.objectId;

export const favoriteRoutesZod = {
  createFavoriteHandler: z.object({
    from: z.string().regex(objectId),
    to: z.string().regex(objectId),
  }),
  deleteFavoriteHandler: z.object({
    id: z.string().regex(objectId),
  }),
};

export type FavoriteRoutesSchema = typeof favoriteRoutesZod;
export type CreateHandlerSchema = z.infer<
  typeof favoriteRoutesZod.createFavoriteHandler
>;
export type DeleteHandlerSchema = z.infer<
  typeof favoriteRoutesZod.deleteFavoriteHandler
>;
