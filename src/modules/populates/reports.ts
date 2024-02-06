import { type User, type Report } from "@/types/mongo";

export const reportPopulateOption = [
  {
    path: "reportedId",
    select: "_id id name nickname profileImageUrl",
  },
];

export interface PopulatedReport extends Omit<Report, "reportedId"> {
  reportedId: Pick<
    User,
    "_id" | "id" | "name" | "nickname" | "profileImageUrl"
  >;
}
