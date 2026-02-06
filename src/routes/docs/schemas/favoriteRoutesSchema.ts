import { z } from "zod";
import patterns from "@/modules/patterns";
import { zodToSchemaObject } from "../utils";

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

export const favoriteRoutesSchema = zodToSchemaObject(favoriteRoutesZod);

export type CreateFavoriteBody = z.infer<
  typeof favoriteRoutesZod.createFavoriteHandler
>;
export type DeleteFavoriteParam = z.infer<
  typeof favoriteRoutesZod.deleteFavoriteHandler
>;
