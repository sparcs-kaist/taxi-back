import { z } from "zod";
import patterns from "../../../modules/patterns";

const objectId = patterns.objectId;

export const favoriteRoutesZod = {
  createHandler: z.object({
    from: z.string().regex(objectId, "Invalid from location ID"),
    to: z.string().regex(objectId, "Invalid to location ID"),
  }),
};

export type FavoriteRoutesSchema = typeof favoriteRoutesZod;
