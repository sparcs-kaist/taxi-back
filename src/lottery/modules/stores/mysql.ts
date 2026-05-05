import { mysqlTable, char, varchar, boolean, datetime, int, text } from "drizzle-orm/mysql-core";
import { Types } from "mongoose";

const objectId = (name: string) => char(name, { length: 24 })
  .$defaultFn(() => new Types.ObjectId().toHexString());

export const eventStatuses = mysqlTable("event_status", {
  id: objectId("id").primaryKey(),
  userId: char("user_id", { length: 24 }).notNull(),
  creditAmount: int("credit_amount").default(0),
  ticket1Amount: int("ticket1_amount").default(0),
  ticket2Amount: int("ticket2_amount").default(0),
  isBanned: boolean("is_banned").default(false),
  inviterId: char("inviter_id", { length: 24 }),
  isInviteUrlEnabled: boolean("is_invite_url_enabled").default(false),
});

export const completedQuests = mysqlTable("completed_quest", {
  id: int("id").autoincrement().primaryKey(),
  eventStatusId: char("event_status_id", { length: 24 }).notNull(),
  questId: varchar("quest_id", { length: 255 }).notNull(),
  completedAt: datetime("completed_at").notNull(),
});

export const quests = mysqlTable("quest", {
  id: objectId("id").primaryKey(),
  questId: varchar("quest_id", { length: 255 }).notNull().unique(), // formerly "id"
  isDisabled: boolean("is_disabled").notNull(),
});

export const items = mysqlTable("item", {
  id: objectId("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: varchar("image_url", { length: 1024 }).notNull(),
  instagramStoryStickerImageUrl: varchar("instagram_story_sticker_image_url", { length: 1024 }),
  price: int("price").notNull(),
  description: text("description").notNull(),
  isDisabled: boolean("is_disabled").default(false),
  stock: int("stock").notNull(),
  realStock: int("real_stock").notNull(),
  itemType: int("item_type").notNull(), // 0, 1, 2, 3, 4
  isRandomItem: boolean("is_random_item").notNull(),
  randomWeight: int("random_weight").notNull(),
  couponCode: varchar("coupon_code", { length: 255 }).unique(),
  couponReward: int("coupon_reward"),
});

export const transactions = mysqlTable("transaction", {
  id: objectId("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(), // 'get', 'use'
  amount: int("amount").notNull(),
  userId: char("user_id", { length: 24 }).notNull(),
  questId: varchar("quest_id", { length: 255 }),
  itemId: char("item_id", { length: 24 }),
  itemAmount: int("item_amount"),
  comment: text("comment").notNull(),
  createdAt: datetime("created_at").notNull(),
});

export const quizzes = mysqlTable("quiz", {
  id: objectId("id").primaryKey(),
  quizDate: datetime("quiz_date").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  image: varchar("image", { length: 1024 }).notNull(),
  answer: varchar("answer", { length: 1 }).default("C"), // A, B, C, D
  countA: int("count_a").default(0),
  countB: int("count_b").default(0),
});

export const quizAnswers = mysqlTable("quiz_answer", {
  id: int("id").autoincrement().primaryKey(),
  quizId: char("quiz_id", { length: 24 }).notNull(),
  userId: char("user_id", { length: 24 }).notNull(),
  answer: varchar("answer", { length: 1 }), // A, B
  submittedAt: datetime("submitted_at").notNull(),
  status: varchar("status", { length: 20 }).default("unknown"), // correct, wrong, unknown, draw
});
