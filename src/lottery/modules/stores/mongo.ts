import mongoose, { Schema } from "mongoose";
import type { Model } from "mongoose";
import { eventConfig } from "@/loadenv";
import type {
  CompletedQuest,
  EventStatus,
  Item,
  Quest,
  Quiz,
  Transaction,
} from "@/lottery/types";

// 이벤트마다 사용된 모델을 구분하기 위해 Prefix 설정
const modelNamePrefix = eventConfig?.mode ?? "";

// 정수 유효성 검사
const integerValidator = {
  validator: Number.isInteger,
  message: "{VALUE} is not an integer value",
};

// 스키마 정의
const completedQuestSchema = new Schema<CompletedQuest>({
  questId: { type: String, required: true },
  completedAt: { type: Date, required: true },
});

const eventStatusSchema = new Schema<EventStatus>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  completedQuests: { type: [completedQuestSchema], default: [] },
  creditAmount: {
    type: Number,
    default: 0,
    min: 0,
    validate: integerValidator,
  },
  ticket1Amount: {
    type: Number,
    default: 0,
    min: 0,
    validate: integerValidator,
  },
  ticket2Amount: {
    type: Number,
    default: 0,
    min: 0,
    validate: integerValidator,
  },
  isBanned: { type: Boolean, default: false },
  inviter: { type: Schema.Types.ObjectId, ref: "User" },
  isInviteUrlEnabled: { type: Boolean, default: false },
});

const questSchema = new Schema<Quest>({
  id: { type: String, required: true, unique: true },
  isDisabled: { type: Boolean, required: true },
});

const itemSchema = new Schema<Item>({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  instagramStoryStickerImageUrl: { type: String },
  price: { type: Number, required: true, min: 0, validate: integerValidator },
  description: { type: String, required: true },
  isDisabled: { type: Boolean, default: false },
  stock: { type: Number, required: true, min: 0, validate: integerValidator },
  realStock: {
    type: Number,
    required: true,
    min: 1,
    validate: integerValidator,
  },
  itemType: { type: Number, enum: [0, 1, 2, 3, 4], required: true },
  isRandomItem: { type: Boolean, required: true },
  randomWeight: {
    type: Number,
    required: true,
    min: 0,
    validate: integerValidator,
  },
  couponCode: { type: String, unique: true },
  couponReward: { type: Number, min: 0, validate: integerValidator },
});

const transactionSchema = new Schema<Transaction>(
  {
    type: { type: String, enum: ["get", "use"], required: true },
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: integerValidator,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questId: { type: String },
    itemId: { type: Schema.Types.ObjectId, ref: `${modelNamePrefix}Item` },
    itemAmount: { type: Number, min: 1, validate: integerValidator },
    comment: { type: String, required: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

const quizSchema = new Schema<Quiz>({
  quizDate: { type: Date, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, required: true },
  answer: { type: String, enum: ["A", "B", "C", "D"], default: "C" },
  countA: { type: Number, default: 0 },
  countB: { type: Number, default: 0 },
  answers: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      answer: { type: String, enum: ["A", "B"] },
      submittedAt: { type: Date, required: true },
      status: {
        type: String,
        enum: ["correct", "wrong", "unknown", "draw"],
        default: "unknown",
      },
    },
  ],
});

// 모델생성
export const eventStatusModel: Model<EventStatus> = mongoose.model(
  `${modelNamePrefix}EventStatus`,
  eventStatusSchema
);

export const questModel: Model<Quest> = mongoose.model(
  `${modelNamePrefix}Quest`,
  questSchema
);

export const itemModel: Model<Item> = mongoose.model(
  `${modelNamePrefix}Item`,
  itemSchema
);

export const transactionModel: Model<Transaction> = mongoose.model(
  `${modelNamePrefix}Transaction`,
  transactionSchema
);

export const quizModel: Model<Quiz> = mongoose.model(
  `${modelNamePrefix}Quiz`,
  quizSchema
);
