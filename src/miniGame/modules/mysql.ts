import { mysqlTable, char, varchar, boolean, datetime, int } from "drizzle-orm/mysql-core";
import { Types } from "mongoose";

const objectId = (name: string) => char(name, { length: 24 })
  .$defaultFn(() => new Types.ObjectId().toHexString());

export const miniGames = mysqlTable("mini_game", {
  id: objectId("id").primaryKey(),
  userId: char("user_id", { length: 24 }).notNull(),
  level: int("level").default(0).notNull(),
  bestRecord: int("best_record").default(0).notNull(),
  usedCredit: int("used_credit").default(0).notNull(),
  preventFail: int("prevent_fail").default(0).notNull(),
  preventBurst: int("prevent_burst").default(0).notNull(),
  dodgeScore: int("dodge_score").default(0).notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const wordChains = mysqlTable("word_chain", {
  id: objectId("id").primaryKey(),
  roomId: char("room_id", { length: 24 }).notNull(),
  currentWord: varchar("current_word", { length: 255 }).notNull(),
  currentPlayerIndex: int("current_player_index").notNull(),
  finished: boolean("finished").default(false).notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const wordChainUsedWords = mysqlTable("word_chain_used_word", {
  id: int("id").autoincrement().primaryKey(),
  wordChainId: char("word_chain_id", { length: 24 }).notNull(),
  word: varchar("word", { length: 255 }).notNull(),
});

export const wordChainPlayers = mysqlTable("word_chain_player", {
  id: int("id").autoincrement().primaryKey(),
  wordChainId: char("word_chain_id", { length: 24 }).notNull(),
  userId: char("user_id", { length: 24 }).notNull(),
  playerOrder: int("player_order").notNull(),
});

export const racings = mysqlTable("racing", {
  id: objectId("id").primaryKey(),
  roomId: char("room_id", { length: 24 }).notNull(),
  status: varchar("status", { length: 50 }), // waiting, starting, canceled, finished
  hostId: char("host_id", { length: 24 }).notNull(),
  createdAt: datetime("created_at").notNull(),
});

export const racingPlayers = mysqlTable("racing_player", {
  id: int("id").autoincrement().primaryKey(),
  racingId: char("racing_id", { length: 24 }).notNull(),
  userId: char("user_id", { length: 24 }).notNull(),
});

export const racingEntries = mysqlTable("racing_entry", {
  id: int("id").autoincrement().primaryKey(),
  racingId: char("racing_id", { length: 24 }).notNull(),
  userId: char("user_id", { length: 24 }).notNull(),
  car: int("car").notNull(),
  amount: int("amount").notNull(),
});

export const dictionaries = mysqlTable("dictionary", {
  id: objectId("id").primaryKey(),
  word: varchar("word", { length: 255 }).notNull().unique(),
});
