import type { Document, Types } from "mongoose";

export interface EventPeriod {
  startAt: Date;
  endAt: Date;
}

export interface CompletedQuest {
  questId: string;
  completedAt: Date;
}

export interface EventStatus extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  completedQuests: CompletedQuest[];
  creditAmount: number;
  ticket1Amount: number;
  ticket2Amount: number;
  isBanned: boolean;
  inviter?: Types.ObjectId;
  isInviteUrlEnabled: boolean;
  group?: string;
}

export interface Reward {
  credit: number;
  ticket1?: number;
}

export interface Quest {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  reward: Reward;
  maxCount?: number;
  isApiRequired?: boolean;
  isDisabled?: boolean;
}

export interface Item extends Document<Types.ObjectId> {
  name: string;
  imageUrl: string;
  instagramStoryStickerImageUrl?: string;
  price: number;
  description: string;
  isDisabled: boolean;
  stock: number;
  realStock: number;
  itemType: 0 | 1 | 2 | 3 | 4;
  isRandomItem: boolean;
  randomWeight: number;
  couponCode?: string;
  couponReward?: number;
}

export interface Transaction extends Document<Types.ObjectId> {
  type: "get" | "use";
  amount: number;
  userId: Types.ObjectId;
  questId?: string;
  itemId?: Types.ObjectId;
  itemAmount?: number;
  comment: string;
  createdAt: Date;
  item?: Types.ObjectId;
}

export interface QuizAnswer {
  userId: Types.ObjectId;
  answer: "A" | "B";
  submittedAt: Date;
  status: "correct" | "wrong" | "unknown" | "draw";
}

export interface Quiz extends Document<Types.ObjectId> {
  quizDate: Date;
  title: string;
  content: string;
  image: string;
  answer: "A" | "B" | "C" | "D";
  countA: number;
  countB: number;
  answers: QuizAnswer[];
}
