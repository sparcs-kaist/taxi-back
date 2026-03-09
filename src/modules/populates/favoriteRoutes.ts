import type { FavoriteRoute } from "@/types/mongo";
import type { Location } from "@/types/mongo";

export const favoriteRoutesPopulateOption = [
  {
    path: "from",
    select: "_id koName enName",
  },
  {
    path: "to",
    select: "_id koName enName",
  },
];

export interface PopulatedFavoriteRoute
  extends Omit<FavoriteRoute, "from" | "to"> {
  from: Pick<Location, "_id" | "koName" | "enName"> | null;
  to: Pick<Location, "_id" | "koName" | "enName"> | null;
}
