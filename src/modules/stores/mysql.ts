import { mysqlTable, char, varchar, boolean, datetime, int, text, double, timestamp } from "drizzle-orm/mysql-core";
import { Types } from "mongoose";

const objectId = (name: string) => char(name, { length: 24 })
  .$defaultFn(() => new Types.ObjectId().toHexString());

export const users = mysqlTable("user", {
  id: objectId("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 255 }).notNull(),
  taxiId: varchar("taxi_id", { length: 255 }).notNull(), // formerly "id"
  profileImageUrl: varchar("profile_image_url", { length: 1024 }).notNull(),
  withdraw: boolean("withdraw").default(false),
  withdrewAt: datetime("withdrew_at"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  badge: boolean("badge"),
  residence: varchar("residence", { length: 255 }),
  ban: boolean("ban").default(false),
  joinat: datetime("joinat").notNull(),
  agreeOnTermsOfService: boolean("agree_on_terms_of_service").default(false),
  savings: double("savings"),
  kaist: varchar("kaist", { length: 255 }).default(""),
  sparcs: varchar("sparcs", { length: 255 }).default(""),
  facebook: varchar("facebook", { length: 255 }).default(""),
  twitter: varchar("twitter", { length: 255 }).default(""),
  email: varchar("email", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false),
  account: varchar("account", { length: 255 }).default(""),
});

export const userRooms = mysqlTable("user_room", {
  id: int("id").autoincrement().primaryKey(),
  userId: char("user_id", { length: 24 }).notNull(),
  roomId: char("room_id", { length: 24 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'ongoing' | 'done'
});

export const bans = mysqlTable("ban", {
  id: objectId("id").primaryKey(),
  userUid: varchar("user_uid", { length: 255 }).notNull(),
  reason: text("reason").notNull(),
  bannedAt: datetime("banned_at").notNull(),
  expireAt: datetime("expire_at").notNull(),
  serviceName: varchar("service_name", { length: 50 }).notNull(),
});

export const deviceTokens = mysqlTable("device_token", {
  id: objectId("id").primaryKey(),
  userId: char("user_id", { length: 24 }).notNull().unique(),
});

export const deviceTokenValues = mysqlTable("device_token_value", {
  id: int("id").autoincrement().primaryKey(),
  deviceTokenId: char("device_token_id", { length: 24 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
});

export const notificationOptions = mysqlTable("notification_option", {
  id: objectId("id").primaryKey(),
  deviceToken: varchar("device_token", { length: 255 }).notNull().unique(),
  chatting: boolean("chatting").default(true).notNull(),
  beforeDepart: boolean("before_depart").default(false).notNull(),
  notice: boolean("notice").default(true).notNull(),
  advertisement: boolean("advertisement").default(false).notNull(),
});

export const notificationOptionKeywords = mysqlTable("notification_option_keyword", {
  id: int("id").autoincrement().primaryKey(),
  optionId: char("option_id", { length: 24 }).notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
});

export const topicSubscriptions = mysqlTable("topic_subscription", {
  id: objectId("id").primaryKey(),
  deviceToken: varchar("device_token", { length: 255 }),
  topic: varchar("topic", { length: 255 }),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
});

export const rooms = mysqlTable("room", {
  id: objectId("id").primaryKey(),
  name: varchar("name", { length: 255 }).default("이름 없음").notNull(),
  fromId: char("from_id", { length: 24 }).notNull(),
  toId: char("to_id", { length: 24 }).notNull(),
  time: datetime("time").notNull(),
  madeat: datetime("madeat").notNull(),
  settlementTotal: int("settlement_total").default(0).notNull(),
  maxPartLength: int("max_part_length").default(4).notNull(),
  emojiIdentifier: varchar("emoji_identifier", { length: 255 }),
});

export const roomParticipants = mysqlTable("room_participant", {
  id: int("id").autoincrement().primaryKey(),
  roomId: char("room_id", { length: 24 }).notNull(),
  userId: char("user_id", { length: 24 }).notNull(),
  settlementStatus: varchar("settlement_status", { length: 50 }).default("not-departed").notNull(),
  readAt: datetime("read_at"),
  isArrived: boolean("is_arrived"),
  hasCarrier: boolean("has_carrier"),
});

export const locations = mysqlTable("location", {
  id: objectId("id").primaryKey(),
  enName: varchar("en_name", { length: 255 }).notNull(),
  koName: varchar("ko_name", { length: 255 }).notNull(),
  priority: int("priority").default(0),
  isValid: boolean("is_valid").default(true),
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
});

export const chats = mysqlTable("chat", {
  id: objectId("id").primaryKey(),
  roomId: char("room_id", { length: 24 }).notNull(),
  type: varchar("type", { length: 50 }),
  authorId: char("author_id", { length: 24 }),
  content: text("content").default(""),
  time: datetime("time").notNull(),
  isValid: boolean("is_valid").default(true),
});

export const reports = mysqlTable("report", {
  id: objectId("id").primaryKey(),
  creatorId: char("creator_id", { length: 24 }).notNull(),
  reportedId: char("reported_id", { length: 24 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  etcDetail: text("etc_detail").default(""),
  time: datetime("time").notNull(),
  roomId: char("room_id", { length: 24 }),
});

export const emails = mysqlTable("email", {
  id: objectId("id").primaryKey(),
  emailAddress: varchar("email_address", { length: 255 }).notNull(),
  reportId: char("report_id", { length: 24 }).notNull(),
  trackingId: varchar("tracking_id", { length: 255 }).notNull().unique(),
  sentAt: datetime("sent_at").notNull(),
  isOpened: boolean("is_opened").notNull(),
  openedAt: datetime("opened_at"),
});

export const adminIPWhitelists = mysqlTable("admin_ip_whitelist", {
  id: objectId("id").primaryKey(),
  ip: varchar("ip", { length: 255 }).notNull(),
  description: text("description").default(""),
});

export const adminLogs = mysqlTable("admin_log", {
  id: objectId("id").primaryKey(),
  userId: char("user_id", { length: 24 }).notNull(),
  time: datetime("time").notNull(),
  ip: varchar("ip", { length: 255 }).notNull(),
  target: varchar("target", { length: 255 }).default(""),
  action: varchar("action", { length: 50 }).notNull(),
});

export const taxiFares = mysqlTable("taxi_fare", {
  id: objectId("id").primaryKey(),
  fromId: char("from_id", { length: 24 }).notNull(),
  toId: char("to_id", { length: 24 }).notNull(),
  isMajor: boolean("is_major").default(false),
  time: int("time").notNull(),
  fare: int("fare").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const notices = mysqlTable("notice", {
  id: objectId("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  notionUrl: varchar("notion_url", { length: 512 }).notNull(),
  isPinned: boolean("is_pinned").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const dailySavings = mysqlTable("daily_savings", {
  id: objectId("id").primaryKey(),
  date: datetime("date").notNull().unique(),
  cumulativeSavings: double("cumulative_savings").notNull(),
});

export const monthlyRoomCreations = mysqlTable("monthly_room_creation", {
  id: objectId("id").primaryKey(),
  month: datetime("month").notNull().unique(),
  cumulativeRooms: int("cumulative_rooms").notNull(),
});

export const monthlyUserCreations = mysqlTable("monthly_user_creation", {
  id: objectId("id").primaryKey(),
  month: datetime("month").notNull().unique(),
  cumulativeUsers: int("cumulative_users").notNull(),
});

export const favoriteRoutes = mysqlTable("favorite_route", {
  id: objectId("id").primaryKey(),
  userId: char("user_id", { length: 24 }).notNull(),
  fromId: char("from_id", { length: 24 }).notNull(),
  toId: char("to_id", { length: 24 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
