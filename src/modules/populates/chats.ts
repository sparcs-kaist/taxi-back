import { type User, type Chat } from "@/types/mongo";

/** @constant {{path: string, select: string}[]}
 * 쿼리를 통해 얻은 Chat Document를 populate할 설정값을 정의합니다.
 */
export const chatPopulateOption = [
  { path: "authorId", select: "_id nickname profileImageUrl" },
];

export interface PopulatedChat extends Omit<Chat, "authorId"> {
  authorId?: Pick<User, "_id" | "nickname" | "profileImageUrl">;
}
