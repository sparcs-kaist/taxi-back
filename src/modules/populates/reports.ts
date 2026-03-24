import type { User, Report } from "@/types/mongo";

export const reportPopulateOption = [
  {
    path: "reportedId",
    select: "_id id name nickname profileImageUrl withdraw",
  },
];

export interface PopulatedReport extends Omit<Report, "reportedId"> {
  reportedId: Pick<
    User,
    "_id" | "id" | "name" | "nickname" | "profileImageUrl" | "withdraw"
  > | null;
}

export type ReportPopulatePath = Pick<PopulatedReport, "reportedId">;
